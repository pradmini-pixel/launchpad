import { useEffect, useState } from "react";
import { StoreProvider, useStore } from "./store";
import {
  createSequence,
  currentStep,
  dotIndex,
  advance,
  skip as skipStep,
} from "./lib/sequenceEngine";
import { isSunday } from "./lib/date";
import { Breathe } from "./components/Breathe";
import { Reframe } from "./components/Reframe";
import { VoiceRep } from "./components/VoiceRep";
import { Briefing } from "./components/Briefing";
import { FocusThree } from "./components/FocusThree";
import { Launch } from "./components/Launch";
import { WeeklyReview } from "./components/WeeklyReview";
import { Settings } from "./components/Settings";
import { SequenceShell } from "./components/SequenceShell";

function EndScreen() {
  return (
    <SequenceShell dot={-1}>
      <div className="center" style={{ minHeight: "60vh", flexDirection: "column", gap: 20 }}>
        <p className="breathe__word">Go</p>
        <p className="caption">Start the day. DayOne is done.</p>
      </div>
    </SequenceShell>
  );
}

// In-tab morning reminder. A local-first SPA can't schedule background
// notifications, so this fires only while a tab is open — one gentle nudge.
function useMorningReminder() {
  const { data } = useStore();
  const time = data.settings.reminderTime;
  useEffect(() => {
    if (!time || !("Notification" in window)) return;
    const [h, m] = time.split(":").map(Number);
    const now = new Date();
    const target = new Date();
    target.setHours(h, m, 0, 0);
    if (target.getTime() <= now.getTime()) target.setDate(target.getDate() + 1);
    const delay = target.getTime() - now.getTime();
    const id = window.setTimeout(() => {
      if (Notification.permission === "granted") {
        new Notification("DayOne", { body: "One calm start before the day." });
      }
    }, delay);
    return () => window.clearTimeout(id);
  }, [time]);
}

function Ritual() {
  const { data } = useStore();
  const [seq, setSeq] = useState(() =>
    createSequence({ breatheOptional: data.streak >= 7 }),
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [weeklySeen, setWeeklySeen] = useState(false);
  const [done, setDone] = useState(false);

  useMorningReminder();

  const step = currentStep(seq);
  const dot = dotIndex(seq);
  const next = () => setSeq((s) => advance(s));
  const skip = () => setSeq((s) => skipStep(s));
  const openSettings = () => setSettingsOpen(true);

  const common = { dot, onNext: next, onSkip: skip, onSettings: openSettings };

  let screen;
  if (done) {
    screen = <EndScreen />;
  } else if (step === "launch" && isSunday() && !weeklySeen) {
    screen = <WeeklyReview onContinue={() => setWeeklySeen(true)} />;
  } else {
    switch (step) {
      case "arrive":
        screen = <Breathe {...common} />;
        break;
      case "reframe":
        screen = <Reframe {...common} />;
        break;
      case "voice":
        screen = <VoiceRep {...common} />;
        break;
      case "briefing":
        screen = <Briefing {...common} />;
        break;
      case "focus":
        screen = <FocusThree {...common} />;
        break;
      case "launch":
        screen = <Launch onGo={() => setDone(true)} />;
        break;
    }
  }

  return (
    <>
      {screen}
      {settingsOpen ? <Settings onClose={() => setSettingsOpen(false)} /> : null}
    </>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <Ritual />
    </StoreProvider>
  );
}
