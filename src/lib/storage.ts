import type { AppData, Settings } from "../types";

// Local-first persistence. Everything lives in one localStorage key so history,
// streaks, and settings survive across mornings on the same device.

const KEY = "dayone.v1";

export const DEFAULT_MODEL = "claude-opus-4-8";

export const DEFAULT_SETTINGS: Settings = {
  apiKey: "",
  model: DEFAULT_MODEL,
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
