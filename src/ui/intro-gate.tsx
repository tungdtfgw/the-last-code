import type { LevelDefinition } from "../game/level-types";

/**
 * Entry screen shown on every level start. Its button is the first user gesture,
 * which unlocks audio so the briefing reveal behind it can play with sound.
 */
export function IntroGate({ level, onEnter }: { level: LevelDefinition; onEnter(): void }) {
  return (
    <div className="intro-gate" role="dialog" aria-modal="true" aria-labelledby="intro-title">
      <div className="intro-inner">
        <p className="intro-kicker">Chương {level.chapter} · Vùng Tối</p>
        <h2 id="intro-title" className="intro-title">
          <span className="level-id">{level.id}</span> {level.title}
        </h2>
        <p className="intro-line">Laptop offline đã khởi động. Kênh nhật ký hệ thống đang chờ giải mã.</p>
        <button type="button" className="btn btn-run intro-enter" onClick={onEnter} autoFocus>
          VÀO NHIỆM VỤ
        </button>
        <p className="intro-hint">Nhấn Enter · bấm hoặc gõ phím bất kỳ trong lúc giải mã để bỏ qua</p>
      </div>
    </div>
  );
}
