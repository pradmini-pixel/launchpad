import type { ReactNode } from "react";
import { DOTTED_STEPS } from "../lib/sequenceEngine";

function Dots({ active }: { active: number }) {
  // active is the current dot index (0–4), or -1 to render nothing (Launch).
  if (active < 0) return <span />;
  return (
    <div className="dots" aria-label={`Step ${active + 1} of ${DOTTED_STEPS.length}`}>
      {DOTTED_STEPS.map((_, i) => (
        <span
          key={i}
          className={
            "dots__dot" +
            (i === active ? " dots__dot--active" : i < active ? " dots__dot--done" : "")
          }
        />
      ))}
    </div>
  );
}

function Gear() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M12 3.2v2.1M12 18.7v2.1M20.8 12h-2.1M5.3 12H3.2M18.2 5.8l-1.5 1.5M7.3 16.7l-1.5 1.5M18.2 18.2l-1.5-1.5M7.3 7.3 5.8 5.8"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function SequenceShell({
  dot,
  onSettings,
  footer,
  children,
}: {
  dot: number;
  onSettings?: () => void;
  footer?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="shell">
      <div className="shell__top">
        <Dots active={dot} />
        {onSettings ? (
          <button className="icon-btn" onClick={onSettings} aria-label="Settings">
            <Gear />
          </button>
        ) : (
          <span />
        )}
      </div>
      <div className="shell__stage">
        <div className="screen">{children}</div>
      </div>
      <div className="shell__bottom">{footer}</div>
    </div>
  );
}
