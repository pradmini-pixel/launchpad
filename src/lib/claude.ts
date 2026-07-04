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

// A provider-agnostic, typed wrapper around whichever AI backend is configured:
// Claude (Anthropic SDK) or any OpenAI-compatible chat endpoint (Groq, a local
// Ollama, or another OpenAI-style server). Every call has a timeout and a
// graceful local fallback, so the ritual is never blocked and never shows a
// broken screen. With no credentials we skip the network entirely.

const REFRAME_TIMEOUT = 20_000;
const COACH_TIMEOUT = 20_000;
const DRILL_TIMEOUT = 20_000;
const BRIEFING_TIMEOUT = 45_000;

// Groq's agentic "compound" system has built-in web search — used for a live
// briefing without a paid search tool.
const GROQ_SEARCH_MODEL = "groq/compound-mini";

/** Whether the configured provider has what it needs to make a call. */
export function hasCredentials(settings: Settings): boolean {
  if (settings.provider === "ollama") return !!settings.baseUrl.trim();
  return settings.apiKey.trim().length > 0;
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

/** Tolerantly pull a JSON object out of a model response (handles fences). */
function extractJson<T>(text: string): T {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("no json object found");
  return JSON.parse(candidate.slice(start, end + 1)) as T;
}

// --- Anthropic transport --------------------------------------------------

function anthropicClient(settings: Settings): Anthropic {
  return new Anthropic({
    apiKey: settings.apiKey.trim(),
    dangerouslyAllowBrowser: true,
  });
}

function firstText(message: Anthropic.Message): string {
  for (const block of message.content) {
    if (block.type === "text") return block.text;
  }
  return "";
}

function jsonFormat(schema: Record<string, unknown>) {
  return { format: { type: "json_schema" as const, schema } };
}

// --- OpenAI-compatible transport (Groq / Ollama / others) -----------------

async function openaiChat(
  settings: Settings,
  system: string,
  user: string,
  opts: { json: boolean; timeout: number; model?: string },
): Promise<string> {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), opts.timeout);
  try {
    const base = settings.baseUrl.trim().replace(/\/$/, "");
    const res = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(settings.apiKey.trim()
          ? { Authorization: `Bearer ${settings.apiKey.trim()}` }
          : {}),
      },
      body: JSON.stringify({
        model: opts.model ?? settings.model,
        temperature: 0.6,
        max_tokens: 1024,
        ...(opts.json ? { response_format: { type: "json_object" } } : {}),
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`http ${res.status}`);
    const data = await res.json();
    return data?.choices?.[0]?.message?.content ?? "";
  } finally {
    clearTimeout(id);
  }
}

// --- Reframe -------------------------------------------------------------

const REFRAME_SYSTEM_CORE =
  " Act as a wise, evidence-based colleague using a light CBT structure. " +
  "Never lecture, never use toxic positivity, never sound like a therapist voiceover. " +
  "Keep every field to one sentence. If no clear cognitive distortion is present, " +
  "return an empty string for distortion.";

export async function reframe(
  text: string,
  settings: Settings,
): Promise<Reframe> {
  if (!hasCredentials(settings)) return localReframe(text);
  const user = `The thought weighing on me this morning: "${text.trim()}"`;
  try {
    if (settings.provider === "anthropic") {
      const message = await anthropicClient(settings).messages.create(
        {
          model: settings.model,
          max_tokens: 400,
          system: aboutBlock(settings.about) + REFRAME_SYSTEM_CORE,
          output_config: jsonFormat({
            type: "object",
            additionalProperties: false,
            required: ["distortion", "counterQuestion", "restatement"],
            properties: {
              distortion: { type: "string" },
              counterQuestion: { type: "string" },
              restatement: { type: "string" },
            },
          }),
          messages: [{ role: "user", content: user }],
        },
        { timeout: REFRAME_TIMEOUT },
      );
      return extractJson<Reframe>(firstText(message));
    }
    const system =
      aboutBlock(settings.about) +
      REFRAME_SYSTEM_CORE +
      ' Respond with ONLY a JSON object with keys "distortion" (string), ' +
      '"counterQuestion" (string), and "restatement" (string). No text outside the JSON.';
    const out = await openaiChat(settings, system, user, {
      json: true,
      timeout: REFRAME_TIMEOUT,
    });
    return extractJson<Reframe>(out);
  } catch {
    return localReframe(text);
  }
}

// --- Voice-rep coaching --------------------------------------------------

const COACH_SYSTEM_CORE =
  " Act as a communications coach who trains managers to speak crisply to C-level " +
  "leadership. Give feedback specific to THIS answer — reference its actual words. " +
  "Never give generic praise. Exactly one strength and one thing to tighten, one sentence each.";

function coachUser(drill: Drill, answer: string): string {
  return [
    `Drill (${drill.title}): ${drill.prompt}`,
    drill.material ? `Material: ${drill.material}` : "",
    `Target structure: ${drill.hint}`,
    `My answer: "${answer.trim()}"`,
  ]
    .filter(Boolean)
    .join("\n");
}

export async function coachVoiceRep(
  drill: Drill,
  answer: string,
  settings: Settings,
): Promise<Coaching> {
  if (!hasCredentials(settings)) return localCoaching(answer);
  const user = coachUser(drill, answer);
  try {
    if (settings.provider === "anthropic") {
      const message = await anthropicClient(settings).messages.create(
        {
          model: settings.model,
          max_tokens: 400,
          system: aboutBlock(settings.about) + COACH_SYSTEM_CORE,
          output_config: jsonFormat({
            type: "object",
            additionalProperties: false,
            required: ["strength", "tighten"],
            properties: {
              strength: { type: "string" },
              tighten: { type: "string" },
            },
          }),
          messages: [{ role: "user", content: user }],
        },
        { timeout: COACH_TIMEOUT },
      );
      return extractJson<Coaching>(firstText(message));
    }
    const system =
      aboutBlock(settings.about) +
      COACH_SYSTEM_CORE +
      ' Respond with ONLY a JSON object with keys "strength" (string) and ' +
      '"tighten" (string). No text outside the JSON.';
    const out = await openaiChat(settings, system, user, {
      json: true,
      timeout: COACH_TIMEOUT,
    });
    return extractJson<Coaching>(out);
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
  if (!hasCredentials(settings)) return fallback;
  const core =
    ` Generate one Executive Voice micro-drill for speaking to senior leadership, ` +
    `tuned to his context (Workday / HR tech / RPA). Use the drill type "${fallback.type}". ` +
    `Make the scenario realistic and specific. Keep it to a few sentences.`;
  try {
    if (settings.provider === "anthropic") {
      const message = await anthropicClient(settings).messages.create(
        {
          model: settings.model,
          max_tokens: 500,
          system: aboutBlock(settings.about) + core,
          output_config: jsonFormat({
            type: "object",
            additionalProperties: false,
            required: ["type", "title", "prompt", "hint"],
            properties: {
              type: { type: "string", enum: ["answer", "cut", "headline", "pushback"] },
              title: { type: "string" },
              prompt: { type: "string" },
              material: { type: "string" },
              hint: { type: "string" },
            },
          }),
          messages: [{ role: "user", content: `Generate today's ${fallback.type} drill.` }],
        },
        { timeout: DRILL_TIMEOUT },
      );
      const drill = extractJson<Drill>(firstText(message));
      if (drill.material === "") delete drill.material;
      return drill;
    }
    const system =
      aboutBlock(settings.about) +
      core +
      ' Respond with ONLY a JSON object with keys "type" (one of "answer","cut",' +
      `"headline","pushback" — use "${fallback.type}"), "title" (short string), ` +
      '"prompt" (string), "material" (string; the rambling text to rewrite for a ' +
      '"cut" drill, otherwise empty), and "hint" (one-line structure hint).';
    const out = await openaiChat(
      settings,
      system,
      `Generate today's ${fallback.type} drill.`,
      { json: true, timeout: DRILL_TIMEOUT },
    );
    const drill = extractJson<Drill>(out);
    if (!drill.type) return fallback;
    if (drill.material === "") delete drill.material;
    return drill;
  } catch {
    return fallback;
  }
}

// --- Briefing ------------------------------------------------------------

const BRIEFING_SCHEMA_NOTE =
  'as an object {"items": BriefingItem[]} with 4 to 5 items. Each BriefingItem is ' +
  "{headline (one line), summary (about 3 sentences), whyItMatters (one line, " +
  'addressed to him), category (one of "workday" | "hrtech" | "ai" | "indie")}.';

/**
 * Live briefing fetch. Throws on any failure (or when the provider has no web
 * search) so callers can fall back to a cached briefing with an honest note.
 */
export async function requestBriefing(
  settings: Settings,
): Promise<BriefingItem[]> {
  const system =
    aboutBlock(settings.about) +
    " Compile a short private morning briefing. Search the web for the latest, most " +
    "relevant developments today across: the Workday ecosystem (releases, DevCon, Extend, " +
    "AI agents), HR technology market, enterprise SaaS and AI-agent trends relevant to HR, " +
    "and one wildcard for indie SaaS / founder insight. Return STRICT JSON only — no prose, " +
    "no markdown fences — " +
    BRIEFING_SCHEMA_NOTE;
  const user =
    "Give me today's briefing as strict JSON. Latest Workday and HR technology news, plus " +
    "enterprise AI-agent trends and one indie/founder item.";

  let out: string;
  if (settings.provider === "anthropic") {
    const message = await anthropicClient(settings).messages.create(
      {
        model: settings.model,
        max_tokens: 2000,
        system,
        tools: [{ type: "web_search_20260209", name: "web_search" }],
        messages: [{ role: "user", content: user }],
      },
      { timeout: BRIEFING_TIMEOUT },
    );
    out = firstText(message);
  } else if (settings.provider === "groq") {
    // Groq's compound model browses the web; JSON mode isn't guaranteed there,
    // so we parse tolerantly.
    out = await openaiChat(settings, system, user, {
      json: false,
      timeout: BRIEFING_TIMEOUT,
      model: GROQ_SEARCH_MODEL,
    });
  } else {
    // No reliable free web search on this provider — use the seed briefing
    // rather than presenting model-invented "news" as real.
    throw new Error("no web search for provider");
  }

  const parsed = extractJson<{ items: BriefingItem[] }>(out);
  const items = Array.isArray(parsed.items) ? parsed.items : [];
  if (!items.length) throw new Error("empty briefing");
  return items.slice(0, 5);
}

/** Convenience wrapper that never throws — returns the seed briefing on failure. */
export async function fetchBriefing(
  settings: Settings,
): Promise<BriefingItem[]> {
  if (!hasCredentials(settings)) return SEED_BRIEFING;
  try {
    return await requestBriefing(settings);
  } catch {
    return SEED_BRIEFING;
  }
}
