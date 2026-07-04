import type { Reframe, Coaching, BriefingItem } from "../types";
import { daysBetween } from "./date";

// Offline content: grounding lines shown when no worry is typed, plus honest
// heuristic fallbacks for the CBT reframe and voice coaching so the app works
// fully without an API key. These are intentionally restrained — a wise
// colleague, never a therapist voiceover, never toxic positivity.

const GROUNDING_LINES = [
  "You don't need to feel ready. You need to start.",
  "The version of this you're dreading rarely shows up.",
  "Competence is quiet. You've done harder mornings than this.",
  "You are allowed to begin before you feel certain.",
  "The work doesn't require your confidence, only your attention.",
  "Most of what weighs on you at 7am is lighter by 10.",
  "Do the next real thing. The rest will follow it.",
];

export function groundingLine(todayKey: string): string {
  const n = Math.max(0, daysBetween("2026-01-01", todayKey));
  return GROUNDING_LINES[n % GROUNDING_LINES.length];
}

// Very light distortion detection for the offline reframe. This is a fallback,
// not a diagnosis — it only names a pattern when the language strongly suggests
// one, and otherwise stays quiet.
const DISTORTION_RULES: { test: RegExp; name: string }[] = [
  { test: /\b(never|always|everything|nothing|no one|everyone)\b/i, name: "all-or-nothing thinking" },
  { test: /\b(disaster|ruin|fail|fired|catastroph|worst|fall apart)\b/i, name: "catastrophizing" },
  { test: /\bthey (think|thought|assume|believe)|will think|must think\b/i, name: "mind-reading" },
  { test: /\b(should|must|have to|supposed to)\b/i, name: "rigid should-ing" },
];

export function localReframe(text: string): Reframe {
  const trimmed = text.trim();
  const match = DISTORTION_RULES.find((r) => r.test.test(trimmed));
  return {
    distortion: match ? match.name : "",
    counterQuestion: match
      ? "What would you tell a sharp colleague who said this to you?"
      : "What's the smallest part of this that's actually true, and what isn't?",
    restatement:
      "This matters to you, which is why it's loud — but a hard morning is not a verdict on the day.",
  };
}

// Heuristic voice-rep coaching: reads the shape of the answer (length, opener,
// hedging) so the feedback is at least specific to what was written, even
// offline. The API path replaces this with genuinely tailored coaching.
const HEDGES = /\b(i think|maybe|sort of|kind of|just|probably|hopefully|i guess|a bit)\b/gi;

export function localCoaching(answer: string): Coaching {
  const trimmed = answer.trim();
  const words = trimmed ? trimmed.split(/\s+/).length : 0;
  const sentences = trimmed.split(/[.!?]+/).filter((s) => s.trim()).length;
  const hedgeCount = (trimmed.match(HEDGES) || []).length;
  const opensWithBecause = /^(because|so|well|um|basically)/i.test(trimmed);

  let strength: string;
  if (sentences <= 3 && words <= 45 && words > 0) {
    strength = "You kept it tight — that restraint reads as command.";
  } else if (!opensWithBecause && words > 0) {
    strength = "You opened with substance rather than a warm-up.";
  } else {
    strength = "You committed to an answer instead of hedging your way in.";
  }

  let tighten: string;
  if (hedgeCount >= 2) {
    tighten = `Cut the hedges (${hedgeCount} of them) — say it as fact, not as a hope.`;
  } else if (words > 55) {
    tighten = "It ran long. Find the one sentence you'd keep if you had ten seconds.";
  } else if (opensWithBecause) {
    tighten = "Lead with the conclusion, then the reason — not the other way around.";
  } else {
    tighten = "Name the next step explicitly so they know what happens after you sit down.";
  }

  return { strength, tighten };
}

// Seed briefing, used before any API fetch and as the last-resort fallback.
export const SEED_BRIEFING: BriefingItem[] = [
  {
    category: "workday",
    headline: "Workday leans harder into agentic AI across the suite",
    summary:
      "Workday continues to position AI agents inside core HCM and financials flows, with Extend and Orchestrate as the surfaces where teams build their own.",
    whyItMatters:
      "Your integration roadmap is the substrate these agents run on — the cleaner your Extend and API layer, the more of this you can adopt without rework.",
  },
  {
    category: "hrtech",
    headline: "HR tech buyers keep consolidating point solutions",
    summary:
      "The market keeps rewarding platforms over stitched-together tools, pushing HR teams to justify every standalone integration they maintain.",
    whyItMatters:
      "Every bespoke integration you own is now a line item someone may question — worth pre-empting with a one-line value story for each.",
  },
  {
    category: "ai",
    headline: "Enterprises move from AI pilots to owned agent workflows",
    summary:
      "The center of gravity is shifting from experiments to durable, governed agent workflows embedded in real processes.",
    whyItMatters:
      "Your RPA-to-agent transition is exactly this arc — framing it as governance-first will land better with leadership than a tools story.",
  },
  {
    category: "indie",
    headline: "Solo founders ship faster with AI-native tooling",
    summary:
      "Indie builders are compressing the distance from idea to shipped product, leaning on AI to cover the surface area a team used to.",
    whyItMatters:
      "The venture doesn't need a team yet — it needs one shipped thing. Today's first action is how that starts.",
  },
];
