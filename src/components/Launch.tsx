import { useEffect, useMemo } from "react";
import { SequenceShell } from "./SequenceShell";
import { useStore } from "../store";
import { longDate } from "../lib/date";

const LINES = [
  "You've done the quiet work. Now go be seen doing it.",
  "The plan is set. Trust it and move.",
  "You're not behind. You're at the start line, on purpose.",
  "Steady hands. Clear head. Go.",
  "Nothing left to decide. Only to begin.",
];

export function Launch({ onGo }: { onGo: () => void }) {
  const { data, today, completeDay } = useStore();

  // Reaching Launch is what makes the day count — record it once.
  useEffect(() => {
    completeDay();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const record = data.days[today];
  const top3 = record?.top3;
  const items = useMemo(
    () =>
      top3
        ? [top3.day, top3.venture, top3.flex].filter((s) => s.text.trim())
        : [],
    [top3],
  );
  const line = useMemo(() => LINES[new Date().getDate() % LINES.length], []);

  return (
    <SequenceShell
      dot={-1}
      footer={
        <button className="btn btn--primary" onClick={onGo}>
          Go
        </button>
      }
    >
      <div className="stack stack--lg">
        <p className="launch__date">{longDate()}</p>

        {items.length ? (
          <div className="launch__three">
            {items.map((s, i) => (
              <div key={i}>
                <p className="launch__item">{s.text}</p>
                {i === 0 && s.firstAction?.trim() ? (
                  <p className="caption">First: {s.firstAction}</p>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <p className="launch__item muted">Open. Yours to shape.</p>
        )}

        <hr className="hairline" />

        <div className="launch__meta">
          <div>
            <div className="metric__num">{data.repCount}</div>
            <div className="metric__label">reps</div>
          </div>
          <div>
            <div className="metric__num">{data.streak}</div>
            <div className="metric__label">day streak</div>
          </div>
        </div>

        <p className="body">{line}</p>
      </div>
    </SequenceShell>
  );
}
