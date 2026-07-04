import type { Drill, DrillType } from "../types";
import { daysBetween } from "./date";

// A local pool of Executive Voice drills, one per type per rotation slot. These
// are used offline (no API key) and as the graceful fallback when generation
// fails. The daily drill rotates deterministically so the same day always shows
// the same drill, and the type advances each day.

const TITLES: Record<DrillType, string> = {
  answer: "The 30-second answer",
  cut: "Cut it in half",
  headline: "Lead with the headline",
  pushback: "The push-back rep",
};

const HINTS: Record<DrillType, string> = {
  answer: "Answer → Reason → Next. Three sentences, no preamble.",
  cut: "Two sentences. Keep the decision and the ask; drop the narration.",
  headline: "Conclusion first, then one supporting point. Nothing else.",
  pushback: "Name the disagreement, then anchor it to data. One line.",
};

const POOL: Record<DrillType, Drill[]> = {
  answer: [
    {
      type: "answer",
      title: TITLES.answer,
      hint: HINTS.answer,
      prompt:
        "The CIO asks: why is the Workday integration backlog growing? Give a three-sentence answer.",
    },
    {
      type: "answer",
      title: TITLES.answer,
      hint: HINTS.answer,
      prompt:
        "A VP asks: are we on track to retire the legacy RPA bots this quarter? Answer in three sentences.",
    },
    {
      type: "answer",
      title: TITLES.answer,
      hint: HINTS.answer,
      prompt:
        "The CFO asks: what did we actually get for the Extend investment? Three sentences.",
    },
  ],
  cut: [
    {
      type: "cut",
      title: TITLES.cut,
      hint: HINTS.cut,
      prompt: "Rewrite this status update in two sentences.",
      material:
        "So basically the team spent most of last week working through the Workday tenant refresh, which took longer than we hoped because the sandbox kept timing out, and then we also had to loop in the security folks about the API scopes, and there was a bit of back and forth on that, and meanwhile the UiPath queue backed up a little, but we think we're mostly caught up now and should be back on the original timeline by end of next week, assuming nothing else comes up.",
    },
    {
      type: "cut",
      title: TITLES.cut,
      hint: HINTS.cut,
      prompt: "Rewrite this in two sentences.",
      material:
        "I wanted to give you a quick update on the integrations program — we've been heads down on a few things, the main one being the new Extend app for onboarding, which is going well but we hit a snag with the orchestrate step, and separately we've been trying to reduce the number of manual touchpoints in the offboarding flow, which is also progressing, and I think overall we're in a good spot but there are a couple of dependencies on the HRIS team that could slip.",
    },
  ],
  headline: [
    {
      type: "headline",
      title: TITLES.headline,
      hint: HINTS.headline,
      prompt:
        "Leadership asks how the quarter went for your team. Lead with the conclusion, then one supporting point.",
    },
    {
      type: "headline",
      title: TITLES.headline,
      hint: HINTS.headline,
      prompt:
        "You're presenting the case to build vs. buy a new integration layer. Give the recommendation first, then your single strongest reason.",
    },
  ],
  pushback: [
    {
      type: "pushback",
      title: TITLES.pushback,
      hint: HINTS.pushback,
      prompt:
        "A senior leader wants to cut the integration testing window in half to hit a date. You disagree. Say it in one respectful line, anchored to data.",
    },
    {
      type: "pushback",
      title: TITLES.pushback,
      hint: HINTS.pushback,
      prompt:
        "The room is leaning toward another RPA bot for a process you think should be re-engineered. Voice the disagreement in one line.",
    },
  ],
};

const TYPE_ORDER: DrillType[] = ["answer", "cut", "headline", "pushback"];

/**
 * Deterministic daily drill: the type advances by day, and within a type we
 * rotate through that type's pool. Anchored to an arbitrary epoch so it is
 * stable regardless of when the user starts.
 */
export function localDrillForDay(todayKey: string): Drill {
  const dayNumber = Math.max(0, daysBetween("2026-01-01", todayKey));
  const type = TYPE_ORDER[dayNumber % TYPE_ORDER.length];
  const pool = POOL[type];
  const cycle = Math.floor(dayNumber / TYPE_ORDER.length);
  return pool[cycle % pool.length];
}
