import { useEffect, useRef, useState } from "react";
import { SequenceShell } from "./SequenceShell";
import { useStore } from "../store";
import { requestBriefing, hasKey } from "../lib/claude";
import { SEED_BRIEFING } from "../lib/grounding";
import type { BriefingItem } from "../types";

const CATEGORY_LABEL: Record<BriefingItem["category"], string> = {
  workday: "Workday",
  hrtech: "HR Tech",
  ai: "AI",
  indie: "Founder",
};

function Card({ item }: { item: BriefingItem }) {
  const [open, setOpen] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  return (
    <button className="card" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
      <div className="card__head">
        <span className="card__headline">{item.headline}</span>
        <span className="card__cat">{CATEGORY_LABEL[item.category]}</span>
      </div>
      <div
        ref={bodyRef}
        className={"card__body" + (open ? " card__body--open" : "")}
        style={{ maxHeight: open ? (bodyRef.current?.scrollHeight ?? 400) : 0, opacity: open ? 1 : 0 }}
      >
        <p className="body">{item.summary}</p>
        <p className="card__why">Why it matters to you — {item.whyItMatters}</p>
      </div>
    </button>
  );
}

export function Briefing({
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
  const { data, today, cacheBriefing } = useStore();
  const [items, setItems] = useState<BriefingItem[] | null>(null);
  const [note, setNote] = useState<string>("");

  useEffect(() => {
    let alive = true;
    const cache = data.briefingCache;

    if (cache && cache.date === today) {
      setItems(cache.items);
      return;
    }
    if (!hasKey(data.settings)) {
      setItems(SEED_BRIEFING);
      return;
    }
    requestBriefing(data.settings)
      .then((fresh) => {
        if (!alive) return;
        setItems(fresh);
        cacheBriefing(fresh);
      })
      .catch(() => {
        if (!alive) return;
        // Graceful fallback: yesterday's briefing, honestly labelled.
        if (cache) {
          setItems(cache.items);
          setNote("Refreshed yesterday");
        } else {
          setItems(SEED_BRIEFING);
        }
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!items) {
    return (
      <SequenceShell dot={dot} onSettings={onSettings}>
        <div className="stack stack--md">
          <h1 className="headline">The briefing</h1>
          <div className="center" style={{ minHeight: "30vh" }}>
            <span className="spinner" />
          </div>
        </div>
      </SequenceShell>
    );
  }

  return (
    <SequenceShell
      dot={dot}
      onSettings={onSettings}
      footer={
        <>
          <button className="btn btn--primary" onClick={onNext}>
            I'm caught up
          </button>
          <button className="btn btn--ghost" onClick={onSkip}>
            Skip
          </button>
        </>
      }
    >
      <div className="stack stack--md">
        <div className="stack stack--sm">
          <h1 className="headline">The briefing</h1>
          {note ? <p className="caption">{note}</p> : null}
        </div>
        <div>
          {items.slice(0, 5).map((item, i) => (
            <Card key={i} item={item} />
          ))}
        </div>
      </div>
    </SequenceShell>
  );
}
