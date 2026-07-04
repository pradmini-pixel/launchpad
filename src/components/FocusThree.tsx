import { useState } from "react";
import { SequenceShell } from "./SequenceShell";
import { useStore } from "../store";
import type { FocusSlot, Top3 } from "../types";

type SlotKey = "day" | "venture" | "flex";

const LABELS: Record<SlotKey, string> = {
  day: "The day job",
  venture: "The venture",
  flex: "Flexible",
};

function emptySlot(): FocusSlot {
  return { text: "", done: false };
}

export function FocusThree({
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
  const { data, today, saveTop3, yesterdayTop3 } = useStore();

  const saved = data.days[today]?.top3;
  const prior = yesterdayTop3();

  // Seed today from what's already saved, else roll over yesterday's unfinished.
  function seed(key: SlotKey): { slot: FocusSlot; rolledOver: boolean } {
    if (saved) return { slot: { ...saved[key] }, rolledOver: false };
    const p = prior?.[key];
    if (p && !p.done && p.text.trim()) {
      return { slot: { text: p.text, done: false, firstAction: p.firstAction }, rolledOver: true };
    }
    return { slot: emptySlot(), rolledOver: false };
  }

  const seeded = {
    day: seed("day"),
    venture: seed("venture"),
    flex: seed("flex"),
  };

  const [day, setDay] = useState<FocusSlot>(seeded.day.slot);
  const [venture, setVenture] = useState<FocusSlot>(seeded.venture.slot);
  const [flex, setFlex] = useState<FocusSlot>(seeded.flex.slot);

  function commit() {
    const top3: Top3 = { day, venture, flex };
    saveTop3(top3);
    onNext();
  }

  const anything = day.text.trim() || venture.text.trim() || flex.text.trim();

  return (
    <SequenceShell
      dot={dot}
      onSettings={onSettings}
      footer={
        <>
          <button className="btn btn--primary" onClick={commit} disabled={!anything}>
            Set the day
          </button>
          <button className="btn btn--ghost" onClick={onSkip}>
            Skip
          </button>
        </>
      }
    >
      <div className="stack stack--lg">
        <h1 className="headline">Today's three.</h1>

        <div className="slot">
          <span className="slot__label">{LABELS.day}</span>
          <input
            className="field field--line"
            placeholder="The one that moves the day job"
            value={day.text}
            onChange={(e) => setDay({ ...day, text: e.target.value })}
            autoFocus
          />
          {seeded.day.rolledOver ? <span className="rollover">Still yours?</span> : null}
          {day.text.trim() ? (
            <input
              className="field field--line"
              placeholder="First physical action? (e.g. open the diff-engine repo)"
              value={day.firstAction ?? ""}
              onChange={(e) => setDay({ ...day, firstAction: e.target.value })}
              style={{ marginTop: 4 }}
            />
          ) : null}
        </div>

        <div className="slot">
          <span className="slot__label">{LABELS.venture}</span>
          <input
            className="field field--line"
            placeholder="The one that moves the venture"
            value={venture.text}
            onChange={(e) => setVenture({ ...venture, text: e.target.value })}
          />
          {seeded.venture.rolledOver ? <span className="rollover">Still yours?</span> : null}
        </div>

        <div className="slot">
          <span className="slot__label">{LABELS.flex}</span>
          <input
            className="field field--line"
            placeholder="Anything else that matters today"
            value={flex.text}
            onChange={(e) => setFlex({ ...flex, text: e.target.value })}
          />
          {seeded.flex.rolledOver ? <span className="rollover">Still yours?</span> : null}
        </div>
      </div>
    </SequenceShell>
  );
}
