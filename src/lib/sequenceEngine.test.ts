import { describe, it, expect } from "vitest";
import {
  STEPS,
  DOTTED_STEPS,
  createSequence,
  currentStep,
  isFirstStep,
  isLaunch,
  dotIndex,
  advance,
  skip,
  back,
  goTo,
  isComplete,
  activeStepsCompleted,
} from "./sequenceEngine";

describe("sequenceEngine", () => {
  it("starts at arrive with no history", () => {
    const s = createSequence();
    expect(currentStep(s)).toBe("arrive");
    expect(isFirstStep(s)).toBe(true);
    expect(isComplete(s)).toBe(false);
    expect(s.completed).toEqual([]);
    expect(s.skipped).toEqual([]);
  });

  it("has six steps with launch last and five progress dots", () => {
    expect(STEPS).toHaveLength(6);
    expect(STEPS[STEPS.length - 1]).toBe("launch");
    expect(DOTTED_STEPS).toHaveLength(5);
    expect(DOTTED_STEPS).not.toContain("launch");
  });

  it("advances through every step in order, marking completion", () => {
    let s = createSequence();
    for (let i = 0; i < STEPS.length - 1; i++) {
      expect(currentStep(s)).toBe(STEPS[i]);
      s = advance(s);
    }
    expect(currentStep(s)).toBe("launch");
    expect(s.completed).toEqual(STEPS.slice(0, 5));
  });

  it("clamps at the launch step and does not run off the end", () => {
    let s = goTo(createSequence(), "launch");
    expect(isLaunch(s)).toBe(true);
    s = advance(s);
    expect(currentStep(s)).toBe("launch");
    expect(s.index).toBe(STEPS.length - 1);
  });

  it("marks the whole sequence complete once launch is advanced past", () => {
    let s = goTo(createSequence(), "launch");
    expect(isComplete(s)).toBe(false);
    s = advance(s);
    expect(isComplete(s)).toBe(true);
  });

  it("records skips distinctly from completions", () => {
    let s = createSequence(); // arrive
    s = skip(s); // skip arrive -> reframe
    expect(s.skipped).toContain("arrive");
    expect(s.completed).not.toContain("arrive");
    expect(currentStep(s)).toBe("reframe");
  });

  it("skipping then re-advancing the same step flips it to completed", () => {
    let s = createSequence();
    s = skip(s); // arrive skipped
    s = back(s); // back to arrive
    s = advance(s); // now complete arrive
    expect(s.completed).toContain("arrive");
    expect(s.skipped).not.toContain("arrive");
  });

  it("does not duplicate a step in completed on repeat advance", () => {
    let s = createSequence();
    s = advance(s); // complete arrive
    s = back(s);
    s = advance(s); // complete arrive again
    expect(s.completed.filter((x) => x === "arrive")).toHaveLength(1);
  });

  it("clamps back at the first step", () => {
    let s = createSequence();
    s = back(s);
    expect(currentStep(s)).toBe("arrive");
    expect(s.index).toBe(0);
  });

  it("reports dot index for active steps and -1 on launch", () => {
    let s = createSequence();
    expect(dotIndex(s)).toBe(0);
    s = goTo(s, "focus");
    expect(dotIndex(s)).toBe(4);
    s = goTo(s, "launch");
    expect(dotIndex(s)).toBe(-1);
  });

  it("goTo ignores unknown steps", () => {
    const s = createSequence();
    // @ts-expect-error deliberately passing an invalid step
    const s2 = goTo(s, "nope");
    expect(s2).toBe(s);
  });

  it("counts only completed active steps, ignoring skips and launch", () => {
    let s = createSequence();
    s = advance(s); // complete arrive
    s = skip(s); // skip reframe
    s = advance(s); // complete voice
    expect(activeStepsCompleted(s)).toBe(2);
  });
});
