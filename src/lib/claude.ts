import Anthropic from "@anthropic-ai/sdk";
import type {
  AboutMe,
  BriefingItem,
  Coaching,
  Drill,
  Reframe,
  Settings,
} from "../types";
import { localReframe, localCoaching, SEED_BRIEFING } from "./grounding";
import { localDrillForDay } from "./drills";

// A thin, typed wrapper around the Anthropic API. Every call has a timeout and
// a graceful local fallback, so the ritual is never blocked by the network and
// never shows a broken screen. When there is no API key, we skip the network
// entirely and use the offline heuristics.

const REFRAME_TIMEOUT = 20_000;
const COACH_TIMEOUT = 20_000;
const DRILL_TIMEOUT = 20_000;
const BRIEFING_TIMEOUT = 45_000;

export function hasKey(settings: Settings): boolean {
  return settings.apiKey.trim().length > 0;
}

function client(settings: Settings): Anthropic {
  return new Anthropic({
    apiKey: settings.apiKey.trim(),
    dangerouslyAllowBrowser: true,
  });
}

function aboutBlock(about: AboutMe): string {
  const name = about.name ? ` His name is ${about.name}.` : "";
  return [
    `You are coaching one person.${name}`,
    `Role: ${about.role}.`,
    `Focus areas: ${about.focusAreas}.`,
    `Goals: ${about.goals}.`,
  ].join(" ");
}

function firstText(message: Anthropic.Message): string {
  for (const block of message.content) {
    if (block.type === "text") return block.text;
  }
  return "";
}

/** Tolerantly pull a JSON object out of a model response (handles fences). */
function extractJson<T>(text: string): T {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("no json object found");
  return JSON.parse(candidate.slice(start, end + 1)) as T;
}

function jsonFormat(schema: Record<string, unknown>) {
  return { format: { type: "json_schema" as const, schema } };
}

// --- Reframe -------------------------------------------------------------

export async function reframe(
  text: string,
  settings: Settings,
): Promise<Reframe> {
  if (!hasKey(settings)) return localReframe(text);
  try {
    const message = await client(settings).messages.create(
      {
        model: settings.model,
        max_tokens: 400,
        system:
          aboutBlock(settings.about) +
          " Act as a wise, evidence-based colleague using a light CBT structure. " +
          "Never lecture, never use toxic positivity, never sound like a therapist voiceover. " +
          "Keep every field to one sentence. If no clear cognitive distortion is present, " +
          "return an empty string for distortion.",
        output_config: jsonFormat({
          type: "object",
          additionalProperties: false,
          required: ["distortion", "counterQuestion", "restatement"],
          properties: {
            distortion: {
              type: "string",
              description:
                "Name the distortion pattern if one is obvious (e.g. catastrophizing, mind-reading, all-or-nothing). Empty string if none.",
            },
            counterQuestion: {
              type: "string",
              description: "One honest, non-leading counter-question.",
            },
            restatement: {
              type: "string",
              description: "One balanced, non-saccharine restatement.",
            },
          },
        }),
        messages: [
          {
            role: "user",
            content: `The thought weighing on me this morning: "${text.trim()}"`,
          },
        ],
      },
      { timeout: REFRAME_TIMEOUT },
    );
    return extractJson<Reframe>(firstText(message));
  } catch {
    return localReframe(text);
  }
}

// --- Voice-rep coaching --------------------------------------------------

export async function coachVoiceRep(
  drill: Drill,
  answer: string,
  settings: Settings,
): Promise<Coaching> {
  if (!hasKey(settings)) return localCoaching(answer);
  try {
    const message = await client(settings).messages.create(
      {
        model: settings.model,
        max_tokens: 400,
        system:
          aboutBlock(settings.about) +
          " Act as a communications coach who trains managers to speak crisply to C-level leadership. " +
          "Give feedback specific to THIS answer — quote or reference its actual words. " +
          "Never give generic praise. Exactly one strength and one thing to tighten, one sentence each.",
        output_config: jsonFormat({
          type: "object",
          additionalProperties: false,
          required: ["strength", "tighten"],
          properties: {
            strength: {
              type: "string",
              description: "One specific thing that was strong about this answer.",
            },
            tighten: {
              type: "string",
              description: "One specific thing to tighten. Actionable, not generic.",
            },
          },
        }),
        messages: [
          {
            role: "user",
            content: [
              `Drill (${drill.title}): ${drill.prompt}`,
              drill.material ? `Material: ${drill.material}` : "",
              `Target structure: ${drill.hint}`,
              `My answer: "${answer.trim()}"`,
            ]
              .filter(Boolean)
              .join("\n"),
          },
        ],
      },
      { timeout: COACH_TIMEOUT },
    );
    return extractJson<Coaching>(firstText(message));
  } catch {
    return localCoaching(answer);
  }
}

// --- Drill generation ----------------------------------------------------

export async function generateDrill(
  settings: Settings,
  todayKey: string,
): Promise<Drill> {
  const fallback = localDrillForDay(todayKey);
  if (!hasKey(settings)) return fallback;
  try {
    const message = await client(settings).messages.create(
      {
        model: settings.model,
        max_tokens: 500,
        system:
          aboutBlock(settings.about) +
          " Generate one Executive Voice micro-drill for speaking to senior leadership, " +
          `tuned to his context (Workday / HR tech / RPA). Use the drill type "${fallback.type}". ` +
          "Make the scenario realistic and specific. Keep it to a few sentences.",
        output_config: jsonFormat({
          type: "object",
          additionalProperties: false,
          required: ["type", "title", "prompt", "hint"],
          properties: {
            type: {
              type: "string",
              enum: ["answer", "cut", "headline", "pushback"],
            },
            title: { type: "string" },
            prompt: { type: "string" },
            material: {
              type: "string",
              description:
                'For "cut" drills, the rambling text to rewrite; otherwise empty string.',
            },
            hint: { type: "string", description: "One-line structure hint." },
          },
        }),
        messages: [
          {
            role: "user",
            content: `Generate today's ${fallback.type} drill. Keep the title short.`,
          },
        ],
      },
      { timeout: DRILL_TIMEOUT },
    );
    const drill = extractJson<Drill>(firstText(message));
    if (drill.material === "") delete drill.material;
    return drill;
  } catch {
    return fallback;
  }
}

// --- Briefing ------------------------------------------------------------

/**
 * Live briefing fetch. Throws on any failure so callers can fall back to a
 * cached briefing with an honest "refreshed …" note. `fetchBriefing` below
 * wraps this to never throw.
 */
export async function requestBriefing(
  settings: Settings,
): Promise<BriefingItem[]> {
  const message = await client(settings).messages.create(
      {
        model: settings.model,
        max_tokens: 2000,
        system:
          aboutBlock(settings.about) +
          " Compile a short private morning briefing. Search the web for the latest, most " +
          "relevant developments today across: the Workday ecosystem (releases, DevCon, Extend, " +
          "AI agents), HR technology market, enterprise SaaS and AI-agent trends relevant to HR, " +
          "and one wildcard for indie SaaS / founder insight. Return STRICT JSON only — no prose, " +
          "no markdown fences — as an object {\"items\": BriefingItem[]} with 4 to 5 items. Each " +
          "BriefingItem is {headline (one line), summary (about 3 sentences), whyItMatters (one " +
          'line, addressed to him), category (one of "workday" | "hrtech" | "ai" | "indie")}.',
        tools: [{ type: "web_search_20260209", name: "web_search" }],
        messages: [
          {
            role: "user",
            content:
              "Give me today's briefing as strict JSON. Latest Workday and HR technology news, plus enterprise AI-agent trends and one indie/founder item.",
          },
        ],
      },
      { timeout: BRIEFING_TIMEOUT },
    );
    const parsed = extractJson<{ items: BriefingItem[] }>(firstText(message));
    const items = Array.isArray(parsed.items) ? parsed.items : [];
    if (!items.length) throw new Error("empty briefing");
    return items.slice(0, 5);
}

/** Convenience wrapper that never throws — returns the seed briefing on failure. */
export async function fetchBriefing(
  settings: Settings,
): Promise<BriefingItem[]> {
  if (!hasKey(settings)) return SEED_BRIEFING;
  try {
    return await requestBriefing(settings);
  } catch {
    return SEED_BRIEFING;
  }
}
