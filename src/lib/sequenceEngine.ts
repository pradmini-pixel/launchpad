import type { StepId } from "../types";

// The sequenceEngine owns the ordering, navigation, skipping, and completion
// state of the morning ritual. It is pure: no I/O, no React, no persistence —
// so it can be exhaustively unit-tested.

/** The five active steps, in order. `launch` is the terminal finale. */
export const STEPS: StepId[] = [
  "arrive",
  "reframe",
  "voice",
  "briefing",
  "focus",
  "launch",
];

/** The five steps shown as progress dots (launch is the finale, not a dot). */
export const DOTTED_STEPS: StepId[] = STEPS.slice(0, 5);

export interface SequenceOptions {
  /**
   * When true, the Arrive breathing step is skippable-by-default (habit formed
   * after ~7 days). The engine still includes the step; the UI reads this flag
   * to offer an immediate "skip" affordance.
   */
  breatheOptional: boolean;
}

export interface SequenceState {
  /** Index into STEPS of the current screen. */
  index: number;
  /** Steps the user has actively completed (not merely visited). */
  completed: StepId[];
  /** Steps the user chose to skip. */
  skipped: StepId[];
  options: SequenceOptions;
}

export function createSequence(
  options: SequenceOptions = { breatheOptional: false },
): SequenceState {
  return { index: 0, completed: [], skipped: [], options };
}

export function currentStep(state: SequenceState): StepId {
  return STEPS[state.index];
}

export function isFirstStep(state: SequenceState): boolean {
  return state.index === 0;
}

export function isLaunch(state: SequenceState): boolean {
  return currentStep(state) === "launch";
}

/** Progress dot index (0–4) for the current step; -1 on the Launch finale. */
export function dotIndex(state: SequenceState): number {
  return DOTTED_STEPS.indexOf(currentStep(state));
}

function withoutStep(list: StepId[], step: StepId): StepId[] {
  return list.filter((s) => s !== step);
}

/** Advance to the next step, marking the current one complete. Clamps at end. */
export function advance(state: SequenceState): SequenceState {
  const step = currentStep(state);
  return {
    ...state,
    index: Math.min(state.index + 1, STEPS.length - 1),
    completed: state.completed.includes(step)
      ? state.completed
      : [...state.completed, step],
    skipped: withoutStep(state.skipped, step),
  };
}

/** Skip the current step (records it as skipped, not completed). */
export function skip(state: SequenceState): SequenceState {
  const step = currentStep(state);
  return {
    ...state,
    index: Math.min(state.index + 1, STEPS.length - 1),
    completed: withoutStep(state.completed, step),
    skipped: state.skipped.includes(step)
      ? state.skipped
      : [...state.skipped, step],
  };
}

/** Step backward. Clamps at the first step. Does not un-record completion. */
export function back(state: SequenceState): SequenceState {
  return { ...state, index: Math.max(state.index - 1, 0) };
}

/** Jump directly to a step (used when resuming a partially-done day). */
export function goTo(state: SequenceState, step: StepId): SequenceState {
  const index = STEPS.indexOf(step);
  return index === -1 ? state : { ...state, index };
}

/** The sequence is done once the user has reached and left the Launch screen. */
export function isComplete(state: SequenceState): boolean {
  return state.completed.includes("launch");
}

/** Count of the five active steps the user actually completed (not skipped). */
export function activeStepsCompleted(state: SequenceState): number {
  return DOTTED_STEPS.filter((s) => state.completed.includes(s)).length;
}
