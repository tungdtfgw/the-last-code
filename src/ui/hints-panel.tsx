import { useEffect, useRef, useState } from "react";
import type { StarCount } from "../storage/progress-repository";

/**
 * The hint log at the foot of the ECHO chat: decode the next level, with a confirm step.
 * Decoded hints are ECHO messages in the chat stream, so only the control lives here.
 */
export function HintsPanel({ hints, opened, onOpen }: { hints: readonly string[]; opened: number; onOpen(n: StarCount): void }) {
  const next = opened + 1;
  const [armed, setArmed] = useState(false);

  const button = useRef<HTMLButtonElement>(null);
  // The confirm step stays until the player clicks elsewhere or presses Esc; no timer.
  useEffect(() => {
    if (!armed) return;
    const disarm = (e: Event) => {
      if (e instanceof KeyboardEvent) {
        if (e.key !== "Escape") return;
        // This Esc only cancels the confirm step; it must not also close the chat.
        e.preventDefault();
        setArmed(false);
      } else if (!button.current?.contains(e.target as Node)) setArmed(false);
    };
    window.addEventListener("pointerdown", disarm, true);
    window.addEventListener("keydown", disarm, true);
    return () => {
      window.removeEventListener("pointerdown", disarm, true);
      window.removeEventListener("keydown", disarm, true);
    };
  }, [armed]);

  return (
    <section className="hints" aria-labelledby="hints-title">
      <header className="hints-head">
        <h3 id="hints-title" className="hints-title">Nhật ký gợi ý</h3>
        <span className="panel-meta">{opened}/3 đã giải mã</span>
      </header>
      {next <= hints.length ? (
        <button
          ref={button}
          type="button"
          className={`btn btn-ghost hint-btn${armed ? " is-armed" : ""}`}
          onClick={() => {
            if (!armed) return setArmed(true);
            setArmed(false);
            onOpen(next as StarCount);
          }}
        >
          {armed ? `Xác nhận: giải mã mức ${next}` : `Giải mã nhật ký gợi ý (mức ${next}/3)`}
        </button>
      ) : (
        <p className="panel-note">Đã giải mã toàn bộ nhật ký.</p>
      )}
      {armed && <p className="panel-note">Bấm lần nữa để giải mã, bấm chỗ khác để hủy. Số gợi ý đã mở hiện trong kết quả.</p>}
    </section>
  );
}
