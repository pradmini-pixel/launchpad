// Shared domain types for DayOne.

export type StepId =
  | "arrive"
  | "reframe"
  | "voice"
  | "briefing"
  | "focus"
  | "launch";

export type DrillType = "answer" | "cut" | "headline" | "pushback";

/** A single Executive Voice drill, generated or drawn from the local pool. */
export interface Drill {
  type: DrillType;
  /** Short title shown as the drill's caption, e.g. "The 30-second answer". */
  title: string;
  /** The scenario / prompt the user responds to. */
  prompt: string;
  /** For "cut" drills: the rambling text the user rewrites. */
  material?: string;
  /** One-line hint about the structure to use. */
  hint: string;
}

/** Coaching feedback on a voice-rep answer. */
export interface Coaching {
  strength: string;
  tighten: string;
}

/** A light CBT reframe of a morning worry. */
export interface Reframe {
  /** Named distortion pattern, if one is obvious. Empty string if none. */
  distortion: string;
  counterQuestion: string;
  restatement: string;
}

/** One Briefing card. */
export interface BriefingItem {
  headline: string;
  summary: string;
  whyItMatters: string;
  category: "workday" | "hrtech" | "ai" | "indie";
}

/** One of the Top-3 focus slots. */
export interface FocusSlot {
  text: string;
  done: boolean;
  /** Only used for the #1 (day-job) slot: the first physical action. */
  firstAction?: string;
}

export interface Top3 {
  day: FocusSlot;
  venture: FocusSlot;
  flex: FocusSlot;
}

/** Everything recorded for a single day. */
export interface DayRecord {
  date: string; // YYYY-MM-DD
  reframe?: { text: string; response?: Reframe };
  voiceRep?: {
    drill: Drill;
    answer: string;
    coaching?: Coaching;
    completed: boolean;
  };
  top3?: Top3;
  completedSteps: StepId[];
  completed: boolean;
}

export interface AboutMe {
  name: string;
  role: string;
  focusAreas: string;
  goals: string;
}

export type ThemeMode = "auto" | "light" | "dark";

/**
 * Which backend powers coaching. "offline" uses on-device heuristics only (the
 * default — no key, no network). "anthropic" uses the Claude SDK directly; the
 * rest are OpenAI-compatible chat endpoints (a local Ollama, or any OpenAI-style
 * server) reached over a shared fetch path.
 */
export type Provider = "offline" | "anthropic" | "ollama" | "openai";

export interface Settings {
  provider: Provider;
  apiKey: string;
  /** Base URL for OpenAI-compatible providers (ignored for "anthropic"). */
  baseUrl: string;
  model: string;
  about: AboutMe;
  theme: ThemeMode;
  reminderTime: string; // "" = off, else "HH:MM"
  breatheAlwaysOn: boolean;
}

export interface AppData {
  version: number;
  days: Record<string, DayRecord>;
  repCount: number;
  streak: number;
  lastCompletedDate: string; // YYYY-MM-DD or ""
  settings: Settings;
  briefingCache?: { date: string; items: BriefingItem[] };
}
