import type { Backdrop, PlayBeat } from "./story-types";

/**
 * Cutscene state, pure. A beat is first "typing", then "shown"; advancing a
 * typing beat only finishes it. Reduced motion plays everything as one
 * transcript where only finish/skip do anything.
 */
export interface CutsceneState {
  index: number;
  phase: "typing" | "shown";
  ended: boolean;
  transcript: boolean;
}

export type CutsceneAction = { type: "advance" } | { type: "typed" } | { type: "auto" } | { type: "skip" } | { type: "finish" };

/** Cards and lore frames appear whole; only log/kai/echo type out. */
const typesOut = (beat: PlayBeat | undefined) => beat !== undefined && beat.kind !== "card" && beat.kind !== "lore";

export function initCutscene(beats: PlayBeat[], reduced: boolean): CutsceneState {
  if (reduced) return { index: Math.max(0, beats.length - 1), phase: "shown", ended: beats.length === 0, transcript: true };
  return { index: 0, phase: typesOut(beats[0]) ? "typing" : "shown", ended: beats.length === 0, transcript: false };
}

export function cutsceneReducer(beats: PlayBeat[]) {
  return (state: CutsceneState, action: CutsceneAction): CutsceneState => {
    if (state.ended) return state;
    if (action.type === "skip" || action.type === "finish") return { ...state, ended: true };
    if (state.transcript) return state;
    if (action.type === "typed") return state.phase === "typing" ? { ...state, phase: "shown" } : state;
    if (action.type === "auto" && state.phase !== "shown") return state;
    if (state.phase === "typing") return { ...state, phase: "shown" };
    const next = state.index + 1;
    if (next >= beats.length) return { ...state, ended: true };
    return { ...state, index: next, phase: typesOut(beats[next]) ? "typing" : "shown" };
  };
}

/** A card wipes the beats before it: while a card is current only it shows; after it, the column restarts. */
export function visibleRange(beats: PlayBeat[], index: number): [number, number] {
  if (beats[index]?.kind === "card") return [index, index];
  let start = 0;
  for (let i = index; i >= 0; i--) {
    if (beats[i].kind === "card") {
      start = i + 1;
      break;
    }
  }
  return [start, index];
}

export function visibleBeats(beats: PlayBeat[], index: number): PlayBeat[] {
  const [from, to] = visibleRange(beats, index);
  return beats.slice(from, to + 1);
}

/** The nearest backdrop declared at or before `index`. */
export function backdropAt(beats: PlayBeat[], index: number): Backdrop {
  for (let i = Math.min(index, beats.length - 1); i >= 0; i--) {
    const b = beats[i].backdrop;
    if (b) return b;
  }
  return "thanh-pho";
}

/** How long a fully shown beat stays before moving on by itself. */
export function autoDelayMs(beat: PlayBeat): number {
  return 1200 + 30 * beat.text.length + (beat.hold_ms ?? 0);
}
