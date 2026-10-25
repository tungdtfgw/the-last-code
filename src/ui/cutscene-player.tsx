import { useEffect, useMemo, useReducer, useRef, useState, type PointerEvent, type ReactNode } from "react";
import type { Cue } from "../audio/sound-recipes";
import { autoDelayMs, backdropAt, cutsceneReducer, initCutscene, visibleRange } from "../story/cutscene-reducer";
import type { PlayBeat } from "../story/story-types";
import { EchoFace } from "./echo-face";
import { LoreText } from "./lore-text";
import { NeuralIdBar } from "./neural-id-bar";
import { StoryBackdrop } from "./story-backdrop";
import { useReducedMotion } from "./use-reduced-motion";
import { useTypewriter } from "./use-typewriter";

const TYPE_MS = 26;
const SPEAKER: Record<PlayBeat["kind"], string> = { log: "", kai: "Kai: ", echo: "ECHO: ", card: "", lore: "Bản ghi khôi phục: " };

export interface CutscenePlayerProps {
  beats: PlayBeat[];
  play(cue: Cue): void;
  /** 0-based Neural-ID slots already filled. */
  collected: readonly number[];
  slots: number;
  /** Called once: when the last beat is passed, on skip, or (transcript) on TIẾP TỤC. */
  onFinish(reason: "end" | "skip"): void;
  /** Shown after the last beat instead of leaving (the teaser's VỀ BẢN ĐỒ). */
  endPanel?: ReactNode;
  /** Extra controls next to BỎ QUA (the mute button), reachable with Tab. */
  controls?: ReactNode;
}

function BeatView({ beat, text, age, current, typing, collected, slots }: {
  beat: PlayBeat;
  text: string;
  age: number;
  current: boolean;
  typing: boolean;
  collected: readonly number[];
  slots: number;
}) {
  const caret = typing && <span className="caret" />;
  if (beat.kind === "card") {
    return (
      <div className="beat beat-card">
        {/* A multi-line card leads with a headline; the rest reads as its caption. */}
        <p className="beat-card-text">
          {text.split("\n").map((line, i, all) => (
            <span key={i} className={i === 0 && all.length > 1 ? "beat-card-head" : undefined}>
              {line}
            </span>
          ))}
        </p>
        {beat.fx === "id_bar" && <NeuralIdBar slots={slots} filled={collected} flashSlot={beat.flashSlot} />}
      </div>
    );
  }
  return (
    <div className={`beat beat-${beat.kind}${current ? " is-current" : ""}`} style={{ ["--age" as string]: age }}>
      {beat.kind === "echo" && (
        <span className="beat-portrait">
          <svg viewBox="0 0 120 120">
            <g className="echo-ch echo-ch-r" stroke="var(--omni)"><EchoFace /></g>
            <g className="echo-ch echo-ch-main" stroke="var(--signal)"><EchoFace /></g>
          </svg>
        </span>
      )}
      {beat.kind === "lore" ? (
        <div className="beat-lore-frame">
          <p className="beat-lore-head">BẢN GHI KHÔI PHỤC</p>
          <p className="beat-text">
            <LoreText text={text} />
            {caret}
          </p>
        </div>
      ) : (
        <p className="beat-text" data-text={beat.kind === "echo" ? text : undefined}>
          {text}
          {caret}
        </p>
      )}
    </div>
  );
}

/**
 * Plays one story (prologue, `after-<id>`, teaser) from its beats. Click, tap,
 * Space or Enter advance one step; Esc or BỎ QUA skip it all. Beats move on by
 * themselves while the tab is visible. Reduced motion shows a transcript.
 * Beat cues play the moment a beat starts; the JS timers here only move between beats.
 */
export function CutscenePlayer({ beats, play, collected, slots, onFinish, endPanel, controls }: CutscenePlayerProps) {
  const reduced = useReducedMotion();
  const reducer = useMemo(() => cutsceneReducer(beats), [beats]);
  const [state, dispatch] = useReducer(reducer, null, () => initCutscene(beats, reduced));
  const { index, phase, ended, transcript } = state;
  const beat = beats[index];
  const root = useRef<HTMLDivElement>(null);
  const column = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const skipped = useRef(false);
  const finished = useRef(false);
  // Events dispatched before mount (the click or Enter that opened this story) must not advance it.
  const mountedAt = useRef(performance.now());
  const [hidden, setHidden] = useState(() => typeof document !== "undefined" && document.hidden);
  // Filled after mount: screen readers ignore text already present when a live region appears.
  const [announce, setAnnounce] = useState("");
  useEffect(() => {
    setAnnounce(!transcript && !ended && beat ? `${SPEAKER[beat.kind]}${beat.text}` : "");
  }, [index, transcript, ended, beat]);

  const typed = useTypewriter(beat?.text ?? "", {
    key: index,
    mode: transcript || phase === "shown" ? "full" : "typing",
    msPerChar: TYPE_MS,
    onTick: () => play(beat?.kind === "echo" ? "echo_voice" : "teletype"),
    onDone: () => dispatch({ type: "typed" }),
  });

  // Keys work at once; the transcript's TIẾP TỤC keeps its autofocus instead.
  useEffect(() => {
    if (!transcript) root.current?.focus({ preventScroll: true });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // One cue per beat, when it starts. StrictMode's second run is merged by the engine.
  useEffect(() => {
    if (transcript || ended) return;
    const cue = beats[index]?.cue;
    if (cue) play(cue);
  }, [index, transcript]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onVisibility = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  // Auto-advance a fully shown beat; paused while the tab is hidden.
  useEffect(() => {
    if (transcript || ended || phase !== "shown" || hidden || !beat) return;
    const id = setTimeout(() => dispatch({ type: "auto" }), autoDelayMs(beat));
    return () => clearTimeout(id);
  }, [index, phase, transcript, ended, hidden, beat]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat || e.timeStamp < mountedAt.current || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === "Escape") {
        e.preventDefault();
        skipped.current = true;
        dispatch({ type: "skip" });
      } else if (e.key === " " || e.key === "Enter") {
        // A focused button handles its own Space/Enter.
        if (e.target instanceof Element && e.target.closest("button")) return;
        e.preventDefault();
        dispatch({ type: "advance" });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!ended || finished.current) return;
    finished.current = true;
    onFinish(skipped.current ? "skip" : "end");
    if (endPanel) requestAnimationFrame(() => endRef.current?.querySelector<HTMLElement>("button, a")?.focus());
  }, [ended]); // eslint-disable-line react-hooks/exhaustive-deps

  // Follow the newest beat (the transcript is read from the top).
  useEffect(() => {
    const el = column.current;
    if (el && !transcript) el.scrollTop = el.scrollHeight;
  }, [index, typed.length, transcript]);

  const onStagePointer = (e: PointerEvent) => {
    if (e.button !== 0 || (e.target instanceof Element && e.target.closest("button"))) return;
    dispatch({ type: "advance" });
  };

  const skip = () => {
    skipped.current = true;
    dispatch({ type: "skip" });
  };

  const [from, to] = transcript ? [0, beats.length - 1] : visibleRange(beats, index);
  const shown = beats.slice(from, to + 1);
  const isCard = !transcript && beat?.kind === "card";
  const idBar = !transcript && !isCard && shown.some((b) => b.fx === "id_bar");
  const backdrop = backdropAt(beats, index);

  return (
    <div
      ref={root}
      className={`story${transcript ? " is-transcript" : ""}${ended ? " is-ended" : ""}`}
      tabIndex={-1}
      onPointerDown={transcript || ended ? undefined : onStagePointer}
    >
      <StoryBackdrop backdrop={transcript ? "thanh-pho" : backdrop} fx={transcript ? undefined : beat?.fx} />
      <div className="story-controls">
        {controls}
        {!ended && (
          <button type="button" className="btn btn-ghost story-skip" onClick={skip}>
            BỎ QUA <kbd>Esc</kbd>
          </button>
        )}
      </div>

      {ended && endPanel ? (
        <div ref={endRef} className="story-end">
          {endPanel}
        </div>
      ) : (
        // Typing text is hidden from screen readers (the live region reads each beat whole); the transcript is not.
        <div className={`story-stage${isCard ? " is-card" : ""}`} aria-hidden={transcript ? undefined : true}>
          <div ref={column} className="story-column">
            {shown.map((b, i) => {
              const at = from + i;
              const current = !transcript && at === index;
              return (
                <BeatView
                  key={at}
                  beat={b}
                  text={current ? typed : b.text}
                  age={transcript ? 0 : index - at}
                  current={current}
                  typing={current && phase === "typing"}
                  collected={collected}
                  slots={slots}
                />
              );
            })}
          </div>
          {idBar && (
            <div className="story-hud">
              <NeuralIdBar slots={slots} filled={collected} />
            </div>
          )}
        </div>
      )}

      <p className="sr-only" aria-live="polite">
        {announce}
      </p>

      {transcript && !ended && (
        <div className="story-transcript-foot">
          <button type="button" className="btn btn-run" autoFocus onClick={() => dispatch({ type: "finish" })}>
            TIẾP TỤC
          </button>
        </div>
      )}
    </div>
  );
}
