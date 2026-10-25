import { useEffect, useState } from "react";
import type { LevelDefinition } from "../game/level-types";

/**
 * Entry screen shown on every level start. Its button is the first user gesture,
 * which unlocks audio so the briefing reveal behind it can play with sound.
 * After a story, `guardMs` swallows clicks for a moment and held keys always,
 * so the Enter that ended the story does not also start the mission.
 */
export function IntroGate({ level, onEnter, guardMs = 0 }: { level: LevelDefinition; onEnter(): void; guardMs?: number }) {
  const [armed, setArmed] = useState(guardMs <= 0);
  useEffect(() => {
    if (guardMs <= 0) return;
    const id = setTimeout(() => setArmed(true), guardMs);
    return () => clearTimeout(id);
  }, [guardMs]);

  return (
    <div className="intro-gate" role="dialog" aria-modal="true" aria-labelledby="intro-title">
      <div className="intro-inner">
        <p className="intro-kicker">
          Chương {level.chapter} · Vùng Tối{level.location ? ` · ${level.location}` : ""}
        </p>
        <h2 id="intro-title" className="intro-title">
          <span className="level-id">{level.id}</span> {level.title}
        </h2>
        {/* Neutral for every level: the laptop boots once in 1.1, Kai only opens it again later. */}
        <p className="intro-line">Kai mở chiếc laptop chưa từng nối mạng. Kênh nhật ký hệ thống đang chờ giải mã.</p>
        <button
          type="button"
          className="btn btn-run intro-enter"
          data-armed={armed}
          onClick={() => armed && onEnter()}
          onKeyDown={(e) => {
            if (e.repeat) e.preventDefault();
          }}
          autoFocus
        >
          VÀO NHIỆM VỤ
        </button>
        <p className="intro-hint">Nhấn Enter · bấm hoặc gõ phím bất kỳ trong lúc giải mã để bỏ qua</p>
      </div>
    </div>
  );
}
