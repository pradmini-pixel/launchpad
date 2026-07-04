import { useEffect, useState } from "react";
import { SequenceShell } from "./SequenceShell";
import { useStore } from "../store";

const CYCLE_MS = 8000;
const CYCLES = 4;

export function Breathe({
  dot,
  onNext,
  onSkip,
  onSettings,
}: {
  dot: number;
  onNext: () => void;
  onSkip: () => void;
  onSettings: () => void;
}) {
  const { data } = useStore();
  // Once the habit is formed (a week in), offer to move on immediately — unless
  // the user has chosen to always keep the breath. Early on, the breath plays
  // through; it is still skippable in one tap. We never force it.
  const canSkipEarly = data.streak >= 7 && !data.settings.breatheAlwaysOn;
  const [cycles, setCycles] = useState(0);
  const done = cycles >= CYCLES;

  useEffect(() => {
    if (done) return;
    const t = setInterval(() => setCycles((c) => c + 1), CYCLE_MS);
    return () => clearInterval(t);
  }, [done]);

  const ready = done || canSkipEarly;

  return (
    <SequenceShell
      dot={dot}
      onSettings={onSettings}
      footer={
        <>
          <button
            className="btn btn--primary"
            onClick={onNext}
            style={{ opacity: ready ? 1 : 0, pointerEvents: ready ? "auto" : "none" }}
          >
            Begin the day
          </button>
          <button className="btn btn--ghost" onClick={onSkip}>
            Skip
          </button>
        </>
      }
    >
      <div className="breathe">
        <div className="breathe__ring" />
        <div className="breathe__word">Breathe</div>
      </div>
    </SequenceShell>
  );
}
