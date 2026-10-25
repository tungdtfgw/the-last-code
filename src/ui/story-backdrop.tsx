import type { Backdrop, BeatFx } from "../story/story-types";
import { CityMatrix } from "./city-matrix";

/** The three story backdrops, plus the one-shot background effects of the current beat. */
export function StoryBackdrop({ backdrop, fx }: { backdrop: Backdrop; fx?: BeatFx }) {
  return (
    <div className={`story-backdrop is-${backdrop}`} aria-hidden="true">
      {backdrop === "terminal" ? (
        <div className="laptop">
          <div className="laptop-screen">
            <span className="laptop-cursor" />
          </div>
        </div>
      ) : (
        <CityMatrix zoom={backdrop === "vung-toi"} fx={fx} />
      )}
      {fx === "alert_tick" && (
        <div className="story-alert">
          <span className="story-alert-label">CẢNH BÁO</span>
          <span className="story-alert-track">
            <span className="story-alert-seg" />
          </span>
        </div>
      )}
    </div>
  );
}
