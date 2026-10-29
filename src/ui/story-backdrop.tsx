import { useEffect, useState, type CSSProperties } from "react";
import { SCENES } from "../story/scene-catalog";
import type { Backdrop, BeatFx } from "../story/story-types";
import { CityMatrix } from "./city-matrix";
import { SceneArt } from "./scene-art";

/** How long a new backdrop takes to fade in over the old one. */
export const CROSSFADE_MS = 600;

interface Layer {
  id: Backdrop;
  gen: number;
}

/** Effects drawn over any backdrop, restarted by `fxKey`. */
const OVERLAY_FX: readonly BeatFx[] = ["alert_tick", "signal_0xa7", "omni_layer", "scan"];
/** Effects the dot-matrix city draws itself. */
const CITY_FX: readonly BeatFx[] = ["city_blink", "eight_fragments", "fragment_found", "trace"];

function Scene({ id, fx }: { id: Backdrop; fx?: BeatFx }) {
  const info = SCENES[id];
  if (id === "terminal") {
    return (
      <div className="laptop">
        <div className="laptop-screen">
          <span className="laptop-cursor" />
        </div>
      </div>
    );
  }
  if (!info.place) {
    return <CityMatrix zoom={id === "vung-toi"} fx={fx && CITY_FX.includes(fx) ? fx : undefined} trace={info.trace} />;
  }
  const style = info.focus && ({
    "--fx": info.focus.x,
    "--fy": info.focus.y,
    "--fscale": info.focus.scale,
  } as CSSProperties);
  return (
    <div className={`scene-frame${fx === "focus" ? " is-focus" : ""}`} style={style}>
      <div className="scene-drift">
        <SceneArt id={id} />
      </div>
      {fx === "trace" && info.trace && (
        <svg className="scene-trace" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">
          <polyline points={info.trace.map((p) => `${p.x},${p.y}`).join(" ")} pathLength={1} />
        </svg>
      )}
    </div>
  );
}

function Overlay({ fx }: { fx: BeatFx }) {
  switch (fx) {
    case "alert_tick":
      return (
        <div className="story-alert">
          <span className="story-alert-label">CẢNH BÁO</span>
          <span className="story-alert-track">
            <span className="story-alert-seg" />
          </span>
        </div>
      );
    case "signal_0xa7":
      return (
        <div className="fx-signal">
          <span className="fx-signal-hex">0xA7</span>
          <span className="fx-signal-bar" />
          <span className="fx-signal-bar" />
          <span className="fx-signal-bar" />
        </div>
      );
    case "omni_layer":
      return <div className="fx-omni" />;
    case "scan":
      return <div className="fx-scan" />;
    default:
      return null;
  }
}

/**
 * The story backdrop: a new backdrop fades in over the old one, and its
 * entrance plays only when the backdrop changes. `still` (transcript) shows one
 * backdrop with no motion and no effects. `fxKey` restarts an overlay effect.
 */
export function StoryBackdrop({ backdrop, fx, fxKey = 0, still = false }: {
  backdrop: Backdrop;
  fx?: BeatFx;
  fxKey?: number;
  still?: boolean;
}) {
  const [layers, setLayers] = useState<Layer[]>([{ id: backdrop, gen: 0 }]);
  const top = layers[layers.length - 1];
  // Derived during render, so the old layer never shows the new beat's effect.
  if (top.id !== backdrop) setLayers([top, { id: backdrop, gen: top.gen + 1 }]);

  useEffect(() => {
    if (layers.length < 2) return;
    const t = setTimeout(() => setLayers((prev) => prev.slice(-1)), CROSSFADE_MS);
    return () => clearTimeout(t);
  }, [layers]);

  const shown = still ? [{ id: backdrop, gen: -1 }] : layers;
  const effect = still ? undefined : fx;
  return (
    <div
      className={`story-backdrop is-${SCENES[backdrop].place ? "place" : backdrop}${still ? " is-still" : ""}`}
      aria-hidden="true"
    >
      {shown.map((l, i) => {
        const isTop = i === shown.length - 1;
        return (
          <div key={`${l.id}-${l.gen}`} className={`scene-layer${isTop ? "" : " is-leaving"}`} data-scene={l.id}>
            <Scene id={l.id} fx={isTop ? effect : undefined} />
          </div>
        );
      })}
      {effect && OVERLAY_FX.includes(effect) && <Overlay key={`${effect}-${fxKey}`} fx={effect} />}
    </div>
  );
}
