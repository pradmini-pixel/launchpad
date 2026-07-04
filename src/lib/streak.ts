import { daysBetween } from "./date";

// Streak, softly. Completing a day nudges the counter up by one. Missing days
// erodes it gently — one point per missed day — but it never resets to zero
// from a single miss, and a completion always leaves you at least at 1. The app
// must never guilt the user, so there is no harsh reset.

export interface StreakResult {
  streak: number;
  lastCompletedDate: string;
}

/**
 * Compute the new streak when the user completes `today`.
 *
 * - First ever completion → 1.
 * - Same day again → unchanged (idempotent).
 * - Consecutive day → +1.
 * - Gap of N days → erode by the (N-1) fully-missed days, floored at 0, then +1
 *   for today's completion. So one skipped day drops you by one, not to zero.
 */
export function applyCompletion(
  current: number,
  lastCompletedDate: string,
  today: string,
): StreakResult {
  if (!lastCompletedDate) {
    return { streak: 1, lastCompletedDate: today };
  }
  const gap = daysBetween(lastCompletedDate, today);
  if (gap <= 0) {
    // Already completed today (or a clock oddity) — leave it be.
    return { streak: Math.max(current, 1), lastCompletedDate: today };
  }
  const missed = gap - 1; // days fully skipped between last completion and today
  const eroded = Math.max(0, current - missed);
  return { streak: eroded + 1, lastCompletedDate: today };
}
