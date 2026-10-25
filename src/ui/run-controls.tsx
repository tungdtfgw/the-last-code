import { forwardRef, useEffect, useState } from "react";
import type { GameState } from "../game/game-reducer";

interface Props {
  state: GameState;
  canRun: boolean;
  editorReady: boolean;
  muted: boolean;
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
  { state, canRun, editorReady, muted, onRun, onReset, onToggleMute },
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
        className={`btn btn-run${busy ? " is-busy" : ""}`}
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
      <button type="button" className="btn btn-icon" aria-pressed={muted} onClick={onToggleMute} title="Phím tắt: M" aria-keyshortcuts="M">
        <svg viewBox="0 0 20 20" aria-hidden="true" width="18" height="18">
          <path d="M3 8h3l4-3.5v11L6 12H3z" fill="currentColor" />
          {muted ? (
            <path d="M13 7.5l4.5 5M17.5 7.5l-4.5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          ) : (
            <path d="M13 7a4 4 0 0 1 0 6M15 5a7 7 0 0 1 0 10" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" />
          )}
        </svg>
        <span>{muted ? "BẬT TIẾNG" : "TẮT TIẾNG"}</span>
      </button>
    </div>
  );
});
