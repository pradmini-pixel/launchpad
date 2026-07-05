import { useStore } from "../store";
import { PROVIDER_PRESETS } from "../lib/storage";
import type { Provider, ThemeMode } from "../types";

const PROVIDERS = Object.keys(PROVIDER_PRESETS) as Provider[];

const THEMES: { key: ThemeMode; label: string }[] = [
  { key: "auto", label: "Auto" },
  { key: "light", label: "Light" },
  { key: "dark", label: "Dark" },
];

function Toggle({
  on,
  onChange,
  label,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      className="seg"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
    >
      <span className={"seg__opt" + (!on ? " seg__opt--on" : "")}>Off</span>
      <span className={"seg__opt" + (on ? " seg__opt--on" : "")}>On</span>
    </button>
  );
}

export function Settings({ onClose }: { onClose: () => void }) {
  const { data, updateSettings } = useStore();
  const s = data.settings;
  const preset = PROVIDER_PRESETS[s.provider];

  function setAbout(patch: Partial<typeof s.about>) {
    updateSettings({ about: { ...s.about, ...patch } });
  }

  // Switching provider seeds its base URL and model, so the common case is
  // one tap. The user can still override either field afterward.
  function selectProvider(p: Provider) {
    const next = PROVIDER_PRESETS[p];
    updateSettings({ provider: p, baseUrl: next.baseUrl, model: next.model });
  }

  function setReminder(value: string) {
    updateSettings({ reminderTime: value });
    if (value && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
  }

  return (
    <div className="sheet">
      <div className="sheet__inner">
        <div className="sheet__row">
          <h1 className="headline" style={{ fontSize: "1.6rem" }}>
            Settings
          </h1>
          <button className="linkbtn" onClick={onClose}>
            Done
          </button>
        </div>

        {/* About me — injected into every coaching prompt. */}
        <div className="stack stack--md">
          <p className="eyebrow">About me</p>
          <div className="slot">
            <span className="slot__label">Name</span>
            <input
              className="field field--line"
              placeholder="Optional"
              value={s.about.name}
              onChange={(e) => setAbout({ name: e.target.value })}
            />
          </div>
          <div className="slot">
            <span className="slot__label">Role</span>
            <textarea
              className="field"
              rows={3}
              value={s.about.role}
              onChange={(e) => setAbout({ role: e.target.value })}
            />
          </div>
          <div className="slot">
            <span className="slot__label">Focus areas</span>
            <textarea
              className="field"
              rows={2}
              value={s.about.focusAreas}
              onChange={(e) => setAbout({ focusAreas: e.target.value })}
            />
          </div>
          <div className="slot">
            <span className="slot__label">Goals</span>
            <textarea
              className="field"
              rows={2}
              value={s.about.goals}
              onChange={(e) => setAbout({ goals: e.target.value })}
            />
          </div>
        </div>

        <hr className="hairline" />

        {/* AI provider — local-first, key stays on this device. */}
        <div className="stack stack--md">
          <p className="eyebrow">Coaching engine</p>

          <div className="slot">
            <span className="slot__label">Provider</span>
            <div className="seg" style={{ flexWrap: "wrap" }}>
              {PROVIDERS.map((p) => (
                <button
                  key={p}
                  className={"seg__opt" + (s.provider === p ? " seg__opt--on" : "")}
                  onClick={() => selectProvider(p)}
                >
                  {PROVIDER_PRESETS[p].label}
                </button>
              ))}
            </div>
            <span className="caption">{PROVIDER_PRESETS[s.provider].note}</span>
          </div>

          {preset.needsKey ? (
            <div className="slot">
              <span className="slot__label">API key</span>
              <input
                className="field field--line"
                type="password"
                placeholder="Stored only on this device"
                value={s.apiKey}
                onChange={(e) => updateSettings({ apiKey: e.target.value })}
                autoComplete="off"
              />
            </div>
          ) : null}

          {s.provider === "ollama" || s.provider === "openai" ? (
            <div className="slot">
              <span className="slot__label">Base URL</span>
              <input
                className="field field--line"
                placeholder="https://…/v1"
                value={s.baseUrl}
                onChange={(e) => updateSettings({ baseUrl: e.target.value })}
              />
            </div>
          ) : null}

          {s.provider !== "offline" ? (
            <div className="slot">
              <span className="slot__label">Model</span>
              <input
                className="field field--line"
                placeholder={preset.model}
                value={s.model}
                onChange={(e) => updateSettings({ model: e.target.value })}
              />
            </div>
          ) : null}
        </div>

        <hr className="hairline" />

        {/* Preferences. */}
        <div className="stack stack--md">
          <p className="eyebrow">The ritual</p>
          <div className="sheet__row">
            <span className="body">Appearance</span>
            <div className="seg">
              {THEMES.map((t) => (
                <button
                  key={t.key}
                  className={"seg__opt" + (s.theme === t.key ? " seg__opt--on" : "")}
                  onClick={() => updateSettings({ theme: t.key })}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="sheet__row">
            <span className="body">Always show the breath</span>
            <Toggle
              on={s.breatheAlwaysOn}
              onChange={(v) => updateSettings({ breatheAlwaysOn: v })}
              label="Always show the breathing guide"
            />
          </div>

          <div className="sheet__row">
            <span className="body">Morning reminder</span>
            <input
              className="field field--line"
              type="time"
              style={{ width: 130 }}
              value={s.reminderTime}
              onChange={(e) => setReminder(e.target.value)}
            />
          </div>
          <span className="caption">
            One gentle nudge, only while DayOne is open in a tab. Clear the time to turn it off.
          </span>
        </div>
      </div>
    </div>
  );
}
