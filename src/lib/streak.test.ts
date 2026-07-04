import { describe, it, expect } from "vitest";
import { applyCompletion } from "./streak";

describe("streak", () => {
  it("starts a streak at 1 on the first completion", () => {
    expect(applyCompletion(0, "", "2026-07-04")).toEqual({
      streak: 1,
      lastCompletedDate: "2026-07-04",
    });
  });

  it("increments on consecutive days", () => {
    expect(applyCompletion(3, "2026-07-03", "2026-07-04").streak).toBe(4);
  });

  it("is idempotent when completing the same day twice", () => {
    expect(applyCompletion(5, "2026-07-04", "2026-07-04").streak).toBe(5);
  });

  it("drops by one for a single missed day, not to zero", () => {
    // last completed the 2nd, missed the 3rd, complete the 4th.
    expect(applyCompletion(5, "2026-07-02", "2026-07-04").streak).toBe(5);
    // 5 - 1 missed = 4, + 1 for today = 5.
  });

  it("erodes further for multiple missed days but never below 1 after completing", () => {
    // last completed the 1st, missed 2/3/4/5, complete the 6th → 4 missed.
    expect(applyCompletion(2, "2026-07-01", "2026-07-06").streak).toBe(1);
    // max(0, 2 - 4) = 0, + 1 = 1.
  });

  it("floors erosion at zero before re-adding the day", () => {
    expect(applyCompletion(1, "2026-07-01", "2026-07-20").streak).toBe(1);
  });
});
