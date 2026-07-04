import type { AppData, Provider, Settings } from "../types";

// Local-first persistence. Everything lives in one localStorage key so history,
// streaks, and settings survive across mornings on the same device.

const KEY = "dayone.v1";

/** Per-provider defaults, applied when the user switches provider in Settings. */
export const PROVIDER_PRESETS: Record<
  Provider,
  { label: string; baseUrl: string; model: string; needsKey: boolean; note: string }
> = {
  groq: {
    label: "Groq (free)",
    // Routed through the Vite dev proxy (see vite.config.ts) to avoid CORS.
    baseUrl: "/groq/openai/v1",
    model: "llama-3.3-70b-versatile",
    needsKey: true,
    note: "Free API key from console.groq.com. Fast, no card required.",
  },
  anthropic: {
    label: "Claude (Anthropic)",
    baseUrl: "",
    model: "claude-opus-4-8",
    needsKey: true,
    note: "Pay-as-you-go key from console.anthropic.com.",
  },
  ollama: {
    label: "Ollama (local)",
    baseUrl: "http://localhost:11434/v1",
    model: "llama3.1",
    needsKey: false,
    note: "Runs entirely on your machine. No key, no cost. Start Ollama first.",
  },
  openai: {
    label: "OpenAI-compatible",
    baseUrl: "",
    model: "",
    needsKey: true,
    note: "Any OpenAI-style /chat/completions endpoint. Set the base URL and model.",
  },
};

export const DEFAULT_MODEL = PROVIDER_PRESETS.groq.model;

export const DEFAULT_SETTINGS: Settings = {
  provider: "groq",
  apiKey: "",
  baseUrl: PROVIDER_PRESETS.groq.baseUrl,
  model: PROVIDER_PRESETS.groq.model,
  about: {
    name: "",
    role: "Senior manager leading an HR Technology team (Workday integrations, Extend, UiPath RPA)",
    focusAreas: "Workday ecosystem, HR technology, enterprise SaaS & AI agents",
    goals: "Lead with executive presence; build toward solo entrepreneurship",
  },
  theme: "auto",
  reminderTime: "",
  breatheAlwaysOn: false,
};

function freshData(): AppData {
  return {
    version: 1,
    days: {},
    repCount: 0,
    streak: 0,
    lastCompletedDate: "",
    settings: { ...DEFAULT_SETTINGS },
  };
}

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return freshData();
    const parsed = JSON.parse(raw) as Partial<AppData>;
    // Merge defensively so older/partial payloads still hydrate cleanly.
    return {
      ...freshData(),
      ...parsed,
      settings: {
        ...DEFAULT_SETTINGS,
        ...(parsed.settings ?? {}),
        about: { ...DEFAULT_SETTINGS.about, ...(parsed.settings?.about ?? {}) },
      },
      days: parsed.days ?? {},
    };
  } catch {
    return freshData();
  }
}

export function saveData(data: AppData): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // Storage full or unavailable (private mode). The ritual still works for
    // this session; we simply don't persist. Never surface a broken screen.
  }
}
