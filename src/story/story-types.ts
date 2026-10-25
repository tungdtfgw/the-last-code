import type { Cue } from "../audio/sound-recipes";

export const BEAT_KINDS = ["log", "kai", "echo", "card"] as const;
export type BeatKind = (typeof BEAT_KINDS)[number];

export const BACKDROPS = ["thanh-pho", "vung-toi", "terminal"] as const;
export type Backdrop = (typeof BACKDROPS)[number];

/** Background effects a beat can trigger once while it is on screen. */
export const BEAT_FX = ["city_blink", "eight_fragments", "alert_tick", "id_bar"] as const;
export type BeatFx = (typeof BEAT_FX)[number];

/** One beat as authored in JSON (chapter file or a level's `outro_beats`). */
export interface StoryBeat {
  kind: BeatKind;
  text: string;
  /** Played once, immediately, when the beat starts. */
  cue?: Cue;
  /** Kept for the following beats until another beat sets one. */
  backdrop?: Backdrop;
  fx?: BeatFx;
  /** Extra time before the beat auto-advances (a long hold or a silence). */
  hold_ms?: number;
}

/** A beat as played. `lore` and `flashSlot` are only produced by `buildStory`, never authored. */
export interface PlayBeat extends Omit<StoryBeat, "kind"> {
  kind: BeatKind | "lore";
  /** 0-based Neural-ID slot that lights up on a component card. */
  flashSlot?: number;
}

export interface ChapterDefinition {
  schema_version: 1;
  chapter: number;
  title: string;
  /** Level ids in play order. An id without a level file is "not built yet". */
  levels: string[];
  neural_id_slots: number;
  prologue: StoryBeat[];
  teaser: StoryBeat[];
}
