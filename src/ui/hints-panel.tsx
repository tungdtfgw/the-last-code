import { useEffect, useState } from "react";
import type { StarCount } from "../storage/progress-repository";

export function HintsPanel({ hints, opened, onOpen }: { hints: readonly string[]; opened: number; onOpen(n: StarCount): void }) {
  const next = opened + 1;
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed) return;
    const id = setTimeout(() => setArmed(false), 5000);
    return () => clearTimeout(id);
  }, [armed]);

  return (
    <section className="panel hints" aria-labelledby="hints-title">
      <header className="panel-head">
        <h2 id="hints-title" className="panel-title">Nhật ký gợi ý</h2>
        <span className="panel-meta">{opened}/3 đã giải mã</span>
      </header>
      {opened > 0 && (
        <ol className="hint-list">
          {hints.slice(0, opened).map((h, i) => (
            <li key={i} className="hint">
              <span className="hint-level">Mức {i + 1}</span>
              <p className="hint-text">{h}</p>
            </li>
          ))}
        </ol>
      )}
      {next <= hints.length ? (
        <button
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
      {armed && <p className="panel-note">Bấm lần nữa để giải mã. Số gợi ý đã mở hiện trong kết quả.</p>}
    </section>
  );
}
