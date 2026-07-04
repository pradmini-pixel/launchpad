import { useMemo } from "react";
import { SequenceShell } from "./SequenceShell";
import { useStore } from "../store";
import { toKey } from "../lib/date";
import type { DrillType } from "../types";

const DRILL_AREA: Record<DrillType, string> = {
  answer: "giving crisp three-sentence answers",
  cut: "cutting rambling updates down to size",
  headline: "leading with the headline",
  pushback: "voicing respectful disagreement",
};

export function WeeklyReview({ onContinue }: { onContinue: () => void }) {
  const { data } = useStore();

  const stats = useMemo(() => {
    const now = new Date();
    let reps = 0;
    let worries = 0;
    let worriesHeld = 0;
    let mornings = 0;
    let intentionsSet = 0;
    const drillCounts: Partial<Record<DrillType, number>> = {};

    for (let i = 0; i < 7; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const rec = data.days[toKey(d)];
      if (!rec) continue;
      if (rec.completed) mornings++;
      if (rec.voiceRep?.completed) {
        reps++;
        const t = rec.voiceRep.drill.type;
        drillCounts[t] = (drillCounts[t] ?? 0) + 1;
      }
      if (rec.reframe?.text) {
        worries++;
        if (rec.reframe.response) worriesHeld++;
      }
      if (rec.top3) intentionsSet++;
    }

    const topDrill = (Object.entries(drillCounts) as [DrillType, number][]).sort(
      (a, b) => b[1] - a[1],
    )[0]?.[0];

    let observation: string;
    if (reps >= 3 && topDrill) {
      observation = `You leaned into ${DRILL_AREA[topDrill]} this week — that muscle is getting stronger.`;
    } else if (worries >= 2) {
      observation =
        "You brought your worries into the light most mornings. Notice how many shrank by evening.";
    } else if (mornings >= 3) {
      observation = "Showing up was the win this week. Consistency compounds quietly.";
    } else {
      observation = "A gentler week. The ritual is here whenever you return to it.";
    }

    return { reps, worries, worriesHeld, mornings, intentionsSet, observation };
  }, [data]);

  return (
    <SequenceShell
      dot={-1}
      footer={
        <button className="btn btn--primary" onClick={onContinue}>
          Carry it forward
        </button>
      }
    >
      <div className="stack stack--lg">
        <div className="stack stack--sm">
          <p className="eyebrow">Sunday reflection</p>
          <h1 className="headline">Your week, quietly.</h1>
        </div>

        <div className="launch__meta" style={{ gap: 32, flexWrap: "wrap" }}>
          <div>
            <div className="metric__num">{stats.reps}</div>
            <div className="metric__label">reps done</div>
          </div>
          <div>
            <div className="metric__num">
              {stats.worriesHeld}/{stats.worries}
            </div>
            <div className="metric__label">worries reframed</div>
          </div>
          <div>
            <div className="metric__num">{stats.mornings}</div>
            <div className="metric__label">mornings kept</div>
          </div>
        </div>

        <hr className="hairline" />
        <p className="body">{stats.observation}</p>
      </div>
    </SequenceShell>
  );
}
