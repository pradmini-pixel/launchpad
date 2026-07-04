import { useMemo, useState } from "react";
import { SequenceShell } from "./SequenceShell";
import { useStore } from "../store";
import { reframe as reframeCall } from "../lib/claude";
import { groundingLine } from "../lib/grounding";
import type { Reframe as ReframeType } from "../types";

export function Reframe({
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
  const { data, today, saveReframe } = useStore();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<ReframeType | null>(null);
  const line = useMemo(() => groundingLine(today), [today]);

  async function handleReframe() {
    const t = text.trim();
    if (!t) return;
    setLoading(true);
    const res = await reframeCall(t, data.settings);
    setResponse(res);
    saveReframe(t, res);
    setLoading(false);
  }

  if (response) {
    return (
      <SequenceShell
        dot={dot}
        onSettings={onSettings}
        footer={
          <button className="btn btn--primary" onClick={onNext}>
            Set it down
          </button>
        }
      >
        <div className="stack stack--md">
          <p className="eyebrow">A steadier way to hold it</p>
          {response.distortion ? (
            <p className="caption">
              That has the shape of <em>{response.distortion}</em>.
            </p>
          ) : null}
          <p className="headline" style={{ fontSize: "1.35rem", lineHeight: 1.35 }}>
            {response.counterQuestion}
          </p>
          <hr className="hairline" />
          <p className="body muted">{response.restatement}</p>
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
          <button
            className="btn btn--primary"
            onClick={handleReframe}
            disabled={!text.trim() || loading}
          >
            {loading ? <span className="spinner" /> : "Reframe it"}
          </button>
          <button className="btn btn--ghost" onClick={onSkip}>
            Nothing this morning
          </button>
        </>
      }
    >
      <div className="stack stack--md">
        <h1 className="headline">Any thought weighing on you this morning?</h1>
        <textarea
          className="field"
          rows={4}
          placeholder="Say it plainly. It stays on this device."
          value={text}
          onChange={(e) => setText(e.target.value)}
          autoFocus
        />
        <p className="caption">{line}</p>
      </div>
    </SequenceShell>
  );
}
