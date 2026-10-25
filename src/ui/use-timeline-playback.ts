import { useCallback, useEffect, useRef, useState } from "react";
import type { Cue } from "../audio/sound-recipes";
import { useReducedMotion } from "./use-reduced-motion";

/** What every simulation timeline frame has in common. */
export interface PlaybackFrame {
  /** How long this frame is held before the next one (ms). */
  hold: number;
  cues: Cue[];
}

interface Options {
  playing: boolean;
  onDone(): void;
  /** `delayMs` schedules the cue on the audio clock (no JS timer that a re-render could cancel). */
  onCue(cue: Cue, delayMs?: number): void;
}

/**
 * Plays a pure timeline back: holds each frame, fires its cues 450 ms apart on the
 * audio clock, calls `onDone` on the last frame. Esc (outside a dialog) or `skip`
 * jumps to the last frame; with reduced motion the last frame shows at once.
 */
export function useTimelinePlayback<F extends PlaybackFrame>(frames: F[], { playing, onDone, onCue }: Options) {
  const reduced = useReducedMotion();
  // Playback position, reset during render whenever a new timeline arrives.
  const [play, setPlay] = useState({ frames, index: 0 });
  if (play.frames !== frames) setPlay({ frames, index: reduced ? Math.max(0, frames.length - 1) : 0 });
  const index = play.frames === frames ? play.index : 0;
  const doneRef = useRef(onDone);
  doneRef.current = onDone;
  const cueRef = useRef(onCue);
  cueRef.current = onCue;

  useEffect(() => {
    if (!playing || play.frames !== frames || frames.length === 0) return;
    const last = frames.length - 1;
    const at = reduced ? last : play.index;
    const frame = frames[at];
    frame.cues.forEach((c, i) => cueRef.current(c, 450 * i));
    if (at >= last) {
      doneRef.current();
      return;
    }
    const id = setTimeout(() => setPlay((p) => (p.frames === frames ? { frames, index: p.index + 1 } : p)), frame.hold);
    return () => {
      clearTimeout(id);
    };
  }, [play, frames, playing, reduced]);

  const skip = useCallback(() => {
    if (!playing || frames.length === 0) return;
    setPlay({ frames, index: frames.length - 1 });
  }, [playing, frames]);

  useEffect(() => {
    if (!playing) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !document.querySelector("dialog[open]")) skip();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [playing, skip]);

  /** The frame on screen (null before the first run). */
  const frame = frames.length ? frames[Math.min(index, frames.length - 1)] : null;
  return { frame, index, skip, reduced };
}
