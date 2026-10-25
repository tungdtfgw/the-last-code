/**
 * Shown when a story is opened directly (reload or link): audio is still locked,
 * so this click (or Enter) is the first gesture. The story starts at once, without
 * waiting for the unlock to finish; the engine plays the first beat's cue once
 * audio runs.
 */
export function StoryGate({ title, onEnter }: { title: string; onEnter(): void }) {
  return (
    <div className="intro-gate" role="dialog" aria-modal="true" aria-labelledby="story-gate-title">
      <div className="intro-inner">
        <p className="intro-kicker">Chương 1 · Vùng Tối</p>
        <h2 id="story-gate-title" className="intro-title">
          {title}
        </h2>
        <p className="intro-line">Đoạn truyện bị ngắt giữa chừng. Kết nối lại để xem từ đầu.</p>
        <button type="button" className="btn btn-run intro-enter" onClick={onEnter} autoFocus>
          TIẾP TỤC ĐOẠN TRUYỆN
        </button>
      </div>
    </div>
  );
}
