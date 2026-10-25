import { forwardRef, useEffect, useState } from "react";
import { MuteButton } from "./mute-button";
import type { GameState } from "../game/game-reducer";

interface Props {
  state: GameState;
  canRun: boolean;
  editorReady: boolean;
  muted: boolean;
  /** No run yet on this level: the run button glows until the first one. */
  firstRun: boolean;
  onRun(): void;
  onReset(): void;
  onToggleMute(): void;
}

function runLabel(state: GameState): string {
  if (state.phase === "running") return "ĐANG CHẠY";
  if (state.phase === "animating") return "ĐANG MÔ PHỎNG";
  if (state.runnerStatus === "restarting") return "LÕI ĐANG KHỞI ĐỘNG LẠI";
  if (state.runnerStatus === "failed") return "LÕI MẤT KẾT NỐI";
  if (state.runnerStatus !== "ready" && state.runnerStatus !== "running") return "LÕI ĐANG KHỞI ĐỘNG";
  return "CHẠY";
}

const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);

export const RunControls = forwardRef<HTMLButtonElement, Props>(function RunControls(
  { state, canRun, editorReady, muted, firstRun, onRun, onReset, onToggleMute },
  runRef,
) {
  const [armedReset, setArmedReset] = useState(false);
  useEffect(() => {
    if (!armedReset) return;
    const id = setTimeout(() => setArmedReset(false), 5000);
    return () => clearTimeout(id);
  }, [armedReset]);

  const label = runLabel(state);
  const busy = label !== "CHẠY";
  return (
    <div className="run-controls">
      <button
        ref={runRef}
        type="button"
        className={`btn btn-run${busy ? " is-busy" : ""}${firstRun && !busy ? " is-first-run" : ""}`}
        // aria-disabled (not disabled) keeps keyboard focus on the button while a run plays.
        onClick={() => canRun && onRun()}
        aria-disabled={!canRun}
        aria-keyshortcuts="Control+Enter Meta+Enter"
        data-testid="run-button"
      >
        <svg className="btn-run-icon" viewBox="0 0 16 16" aria-hidden="true">
          <path d="M4 2.5 L13 8 L4 13.5 Z" fill="currentColor" />
        </svg>
        <span>{label}</span>
        {!busy && <kbd>{isMac ? "⌘" : "Ctrl"} + Enter</kbd>}
      </button>
      <button
        type="button"
        className={`btn btn-ghost${armedReset ? " is-armed" : ""}`}
        onClick={() => {
          if (!armedReset) return setArmedReset(true);
          setArmedReset(false);
          onReset();
        }}
        disabled={!editorReady || state.phase === "running" || state.phase === "animating"}
      >
        {armedReset ? "Xác nhận khôi phục" : "Khôi phục mã gốc"}
      </button>
      <MuteButton muted={muted} onToggle={onToggleMute} />
    </div>
  );
});
