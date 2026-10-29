import { memo } from "react";
import type { ScenePoint } from "../story/scene-catalog";

const COLS = 48;
const ROWS = 28;
const STEP = 10;
/** The Dark Zone: an off patch in the top-right corner of the city grid. */
const ZONE = { cx: 37.5, cy: 5.5, rx: 6.5, ry: 4.2 };
/** Where the eight Architects hid their fragments (grid coordinates). */
const FRAGMENTS = [
  [6, 4], [15, 20], [22, 9], [30, 24], [41, 15], [9, 13], [27, 17], [44, 25],
] as const;

/** Small deterministic PRNG so the city is the same on every load. */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Dot {
  x: number;
  y: number;
  r: number;
  o: number;
  band: number;
}

const DOTS: { lit: Dot[]; dark: Dot[] } = (() => {
  const rand = mulberry32(2089);
  const lit: Dot[] = [];
  const dark: Dot[] = [];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const v = rand();
      // Sparse blocks and "streets": skip some cells so the grid reads as a city, not a texture.
      if (v < 0.18 || (col % 7 === 3 && rand() < 0.7) || (row % 6 === 2 && rand() < 0.6)) continue;
      const dot = { x: col * STEP + 5, y: row * STEP + 5, r: v > 0.92 ? 1.7 : 1.15, o: 0.25 + rand() * 0.55, band: Math.floor(rand() * 3) };
      const inZone = ((col - ZONE.cx) / ZONE.rx) ** 2 + ((row - ZONE.cy) / ZONE.ry) ** 2 < 1;
      (inZone ? dark : lit).push(dot);
    }
  }
  return { lit, dark };
})();

export const CITY_VIEWBOX = `0 0 ${COLS * STEP} ${ROWS * STEP}`;

/**
 * Dot-matrix map of the city breathing with OMNI; the switched-off patch in the
 * top corner is the Dark Zone (kept in view on narrow screens). `zoom` closes in on it. Static for reduced motion (CSS).
 */
export const CityMatrix = memo(function CityMatrix({ zoom = false, fx, trace }: {
  zoom?: boolean;
  fx?: string;
  /** Path of the `trace` effect, in percent of the map. */
  trace?: ScenePoint[];
}) {
  return (
    <svg
      className={`city${zoom ? " is-zoomed" : ""}${fx ? ` fx-${fx}` : ""}`}
      viewBox={CITY_VIEWBOX}
      preserveAspectRatio="xMaxYMin slice"
      aria-hidden="true"
      focusable="false"
    >
      <g className="city-pan">
        {[0, 1, 2].map((band) => (
          <g key={band} className={`city-band city-band-${band}`}>
            {DOTS.lit
              .filter((d) => d.band === band)
              .map((d) => (
                <circle key={`${d.x},${d.y}`} cx={d.x} cy={d.y} r={d.r} opacity={d.o} />
              ))}
          </g>
        ))}
        <g className="city-dark">
          {DOTS.dark.map((d) => (
            <circle key={`${d.x},${d.y}`} cx={d.x} cy={d.y} r={0.9} />
          ))}
        </g>
        <ellipse
          className="city-zone"
          cx={ZONE.cx * STEP + 5}
          cy={ZONE.cy * STEP + 5}
          rx={ZONE.rx * STEP}
          ry={ZONE.ry * STEP}
        />
        {(fx === "eight_fragments" || fx === "fragment_found") && (
          <g className={`city-fragments${fx === "fragment_found" ? " is-found" : ""}`}>
            {FRAGMENTS.map(([c, r], i) => (
              <circle key={i} cx={c * STEP + 5} cy={r * STEP + 5} r={3} style={{ ["--i" as string]: i }} />
            ))}
          </g>
        )}
        {fx === "trace" && trace && (
          <polyline
            className="city-trace"
            points={trace.map((p) => `${(p.x / 100) * COLS * STEP},${(p.y / 100) * ROWS * STEP}`).join(" ")}
            pathLength={1}
          />
        )}
      </g>
    </svg>
  );
});
