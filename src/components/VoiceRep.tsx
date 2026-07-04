import { useEffect, useRef, useState } from "react";
import { SequenceShell } from "./SequenceShell";
import { useStore } from "../store";
import { generateDrill, coachVoiceRep } from "../lib/claude";
import type { Coaching, Drill } from "../types";

// Optional speech-to-text. Feature-detected; absent gracefully on browsers
// without the Web Speech API. Typing is always available.
type SR = typeof window & {
  SpeechRecognition?: new () => any;
  webkitSpeechRecognition?: new () => any;
};

function useDictation(onText: (t: string) => void) {
  const [listening, setListening] = useState(false);
  const recRef = useRef<any>(null);
  const w = window as SR;
  const Supported = w.SpeechRecognition || w.webkitSpeechRecognition;

  function toggle() {
    if (!Supported) return;
    if (listening) {
      recRef.current?.stop();
      return;
    }
    const rec = new Supported();
    rec.continuous = true;
    rec.interimResults = false;
    rec.onresult = (e: any) => {
      let out = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        out += e.results[i][0].transcript;
      }
      if (out) onText(out);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    rec.start();
    setListening(true);
  }

  useEffect(() => () => recRef.current?.stop(), []);
  return { supported: !!Supported, listening, toggle };
}

export function VoiceRep({
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
  const { data, today, saveVoiceRep } = useStore();
  const [drill, setDrill] = useState<Drill | null>(null);
  const [answer, setAnswer] = useState("");
  const [coaching, setCoaching] = useState<Coaching | null>(null);
  const [coaching_loading, setCoachingLoading] = useState(false);

  const dictation = useDictation((t) =>
    setAnswer((a) => (a ? a + " " + t : t)),
  );

  useEffect(() => {
    let alive = true;
    generateDrill(data.settings, today).then((d) => {
      if (alive) setDrill(d);
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function getCoaching() {
    if (!drill || !answer.trim()) return;
    setCoachingLoading(true);
    const c = await coachVoiceRep(drill, answer, data.settings);
    setCoaching(c);
    saveVoiceRep(drill, answer, c, true);
    setCoachingLoading(false);
  }

  if (!drill) {
    return (
      <SequenceShell dot={dot} onSettings={onSettings}>
        <div className="center" style={{ minHeight: "40vh" }}>
          <span className="spinner" />
        </div>
      </SequenceShell>
    );
  }

  if (coaching) {
    return (
      <SequenceShell
        dot={dot}
        onSettings={onSettings}
        footer={
          <button className="btn btn--primary" onClick={onNext}>
            One rep done
          </button>
        }
      >
        <div className="stack stack--md">
          <p className="eyebrow">The coaching</p>
          <div className="stack stack--sm">
            <p className="caption">What was strong</p>
            <p className="body">{coaching.strength}</p>
          </div>
          <hr className="hairline" />
          <div className="stack stack--sm">
            <p className="caption">One thing to tighten</p>
            <p className="body">{coaching.tighten}</p>
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
          <button
            className="btn btn--primary"
            onClick={getCoaching}
            disabled={!answer.trim() || coaching_loading}
          >
            {coaching_loading ? <span className="spinner" /> : "Get coaching"}
          </button>
          <button className="btn btn--ghost" onClick={onSkip}>
            Skip today's rep
          </button>
        </>
      }
    >
      <div className="stack stack--md">
        <p className="eyebrow">{drill.title}</p>
        <h1 className="headline" style={{ fontSize: "1.5rem", lineHeight: 1.3 }}>
          {drill.prompt}
        </h1>
        {drill.material ? (
          <p className="body muted" style={{ fontStyle: "italic" }}>
            "{drill.material}"
          </p>
        ) : null}
        <textarea
          className="field"
          rows={4}
          placeholder="Say it out loud first, then write it here."
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          autoFocus
        />
        <div className="sheet__row">
          <p className="caption">{drill.hint}</p>
          {dictation.supported ? (
            <button className="linkbtn" onClick={dictation.toggle}>
              {dictation.listening ? "Stop" : "Dictate"}
            </button>
          ) : null}
        </div>
      </div>
    </SequenceShell>
  );
}
