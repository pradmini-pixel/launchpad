// Small date helpers. All dates are handled as local-time YYYY-MM-DD strings so
// that "today" always means the user's morning, not UTC.

export function toKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayKey(now: Date = new Date()): string {
  return toKey(now);
}

export function yesterdayKey(now: Date = new Date()): string {
  const d = new Date(now);
  d.setDate(d.getDate() - 1);
  return toKey(d);
}

/** Whole days between two YYYY-MM-DD keys (later - earlier). */
export function daysBetween(earlier: string, later: string): number {
  const a = Date.parse(`${earlier}T00:00:00`);
  const b = Date.parse(`${later}T00:00:00`);
  return Math.round((b - a) / 86_400_000);
}

/** 0 = Sunday. Used to surface the weekly reflection card. */
export function isSunday(now: Date = new Date()): boolean {
  return now.getDay() === 0;
}

export function longDate(now: Date = new Date()): string {
  return now.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}
