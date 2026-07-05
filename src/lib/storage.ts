import type { AppData, Provider, Settings } from "../types";

// Local-first persistence. Everything lives in one localStorage key so history,
// streaks, and settings survive across mornings on the same device.

const KEY = "dayone.v1";

/** Per-provider defaults, applied when the user switches provider in Settings. */
export const PROVIDER_PRESETS: Record<
  Provider,
  { label: string; baseUrl: string; model: string; needsKey: boolean; note: string }
> = {
  offline: {
    label: "On-device (free)",
    baseUrl: "",
    model: "",
    needsKey: false,
    note: "Runs entirely on your device — local coaching and a sample briefing. No key, no network.",
  },
  anthropic: {
    label: "Claude (Anthropic)",
    baseUrl: "",
    model: "claude-opus-4-8",
    needsKey: true,
    note: "Pay-as-you-go key from console.anthropic.com. Works directly from the browser.",
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

const VALID_PROVIDERS = Object.keys(PROVIDER_PRESETS) as Provider[];

export const DEFAULT_SETTINGS: Settings = {
  provider: "offline",
  apiKey: "",
  baseUrl: "",
  model: "",
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
    const settings = {
      ...DEFAULT_SETTINGS,
      ...(parsed.settings ?? {}),
      about: { ...DEFAULT_SETTINGS.about, ...(parsed.settings?.about ?? {}) },
    };
    // A payload from an older build may name a provider we no longer ship.
    if (!VALID_PROVIDERS.includes(settings.provider)) {
      settings.provider = "offline";
    }
    return { ...freshData(), ...parsed, settings, days: parsed.days ?? {} };
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
