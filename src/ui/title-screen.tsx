import { useEffect, useState } from "react";
import { CityMatrix } from "./city-matrix";
import { MuteButton } from "./mute-button";
import { useReducedMotion } from "./use-reduced-motion";

/** Title glitch: once every 6–8 s, never with reduced motion. */
function useTitleGlitch(): boolean {
  const reduced = useReducedMotion();
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (reduced) return;
    let id: ReturnType<typeof setTimeout>;
    const schedule = () => {
      id = setTimeout(() => {
        setOn(true);
        id = setTimeout(() => {
          setOn(false);
          schedule();
        }, 450);
      }, 6000 + Math.random() * 2000);
    };
    schedule();
    return () => clearTimeout(id);
  }, [reduced]);
  return on;
}

/**
 * Silent until the first click: the app unlocks audio and plays `pulse` in
 * onStart/onContinue. Presentational only; the app decides where buttons lead.
 */
export function TitleScreen(props: {
  returning: boolean;
  persistent: boolean;
  muted: boolean;
  onStart(): void;
  onContinue(): void;
  onMap(): void;
  onToggleMute(): void;
}) {
  const glitch = useTitleGlitch();
  return (
    <main className="screen title-screen">
      <CityMatrix />
      <div className="title-center">
        <p className="title-kicker">THE LAST CODE</p>
        <h1 className={`title-name${glitch ? " is-glitching" : ""}`} data-text="MÃ CUỐI CÙNG">
          MÃ CUỐI CÙNG
        </h1>
        <p className="title-tagline">Khi máy làm thay tất cả, tự viết mã là vũ khí cuối cùng.</p>
        <div className="title-actions">
          {props.returning ? (
            <>
              <button type="button" className="btn btn-run title-primary" onClick={props.onContinue} autoFocus>
                TIẾP TỤC
              </button>
              <button type="button" className="btn btn-ghost" onClick={props.onMap}>
                BẢN ĐỒ VÙNG TỐI
              </button>
            </>
          ) : (
            <button type="button" className="btn btn-run title-primary" onClick={props.onStart} autoFocus>
              BẮT ĐẦU
            </button>
          )}
        </div>
      </div>
      <footer className="title-foot">
        <MuteButton muted={props.muted} onToggle={props.onToggleMute} />
        {props.persistent ? (
          <p className="title-save">Tiến độ lưu trên trình duyệt này.</p>
        ) : (
          <p className="storage-flag" role="status" title="Trình duyệt chặn bộ nhớ: tiến độ chỉ giữ trong phiên này.">
            CHẾ ĐỘ KHÔNG LƯU
          </p>
        )}
      </footer>
    </main>
  );
}
