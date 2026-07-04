import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type {
  AppData,
  BriefingItem,
  Coaching,
  Drill,
  Reframe,
  Settings,
  Top3,
} from "./types";
import { loadData, saveData } from "./lib/storage";
import { todayKey, yesterdayKey } from "./lib/date";
import { applyCompletion } from "./lib/streak";

interface Store {
  data: AppData;
  today: string;
  updateSettings: (patch: Partial<Settings>) => void;
  saveReframe: (text: string, response?: Reframe) => void;
  saveVoiceRep: (
    drill: Drill,
    answer: string,
    coaching: Coaching | undefined,
    completed: boolean,
  ) => void;
  saveTop3: (top3: Top3) => void;
  cacheBriefing: (items: BriefingItem[]) => void;
  completeDay: () => void;
  yesterdayTop3: () => Top3 | undefined;
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(() => loadData());
  const today = todayKey();

  // Persist on every change.
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    saveData(data);
  }, [data]);

  // Apply theme to <html> so CSS variables resolve for the chosen mode.
  useEffect(() => {
    const el = document.documentElement;
    if (data.settings.theme === "auto") el.removeAttribute("data-theme");
    else el.setAttribute("data-theme", data.settings.theme);
  }, [data.settings.theme]);

  const store = useMemo<Store>(() => {
    // Ensure today's record exists before mutating it.
    function withToday(mut: (d: AppData) => void) {
      setData((prev) => {
        const next: AppData = {
          ...prev,
          days: { ...prev.days },
        };
        if (!next.days[today]) {
          next.days[today] = {
            date: today,
            completedSteps: [],
            completed: false,
          };
        } else {
          next.days[today] = { ...next.days[today] };
        }
        mut(next);
        return next;
      });
    }

    return {
      data,
      today,
      updateSettings(patch) {
        setData((prev) => ({
          ...prev,
          settings: { ...prev.settings, ...patch },
        }));
      },
      saveReframe(text, response) {
        withToday((d) => {
          d.days[today].reframe = { text, response };
        });
      },
      saveVoiceRep(drill, answer, coaching, completed) {
        withToday((d) => {
          d.days[today].voiceRep = { drill, answer, coaching, completed };
        });
      },
      saveTop3(top3) {
        withToday((d) => {
          d.days[today].top3 = top3;
        });
      },
      cacheBriefing(items) {
        setData((prev) => ({
          ...prev,
          briefingCache: { date: today, items },
        }));
      },
      completeDay() {
        setData((prev) => {
          const already = prev.days[today]?.completed;
          const day = prev.days[today]
            ? { ...prev.days[today], completed: true }
            : { date: today, completedSteps: [], completed: true };

          // Rep count increments once per completed voice rep, once per day.
          const repDoneToday = day.voiceRep?.completed && !already;
          const { streak, lastCompletedDate } = already
            ? { streak: prev.streak, lastCompletedDate: prev.lastCompletedDate }
            : applyCompletion(prev.streak, prev.lastCompletedDate, today);

          return {
            ...prev,
            days: { ...prev.days, [today]: day },
            repCount: prev.repCount + (repDoneToday ? 1 : 0),
            streak,
            lastCompletedDate,
          };
        });
      },
      yesterdayTop3() {
        return data.days[yesterdayKey()]?.top3;
      },
    };
  }, [data, today]);

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
