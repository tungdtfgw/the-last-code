import { useId, type ReactNode } from "react";
import type { Backdrop } from "../story/story-types";

/*
 * The place scenes, drawn in the city map's language: shapes filled with the
 * same dot matrix, thin edges, and only three lights (signal teal, OMNI red,
 * a warm bulb). What makes them uneasy is the air: fog that drifts, lights
 * that falter, dust that hangs, and now and then the whole scene losing hold.
 * Coordinates are a 160×90 frame; `scene-catalog.ts` points into the same frame in percent.
 */

type Ids = {
  dots: string;
  dim: string;
  win: string;
  tile: string;
  hatch: string;
  fog: string;
  teal: string;
  warm: string;
  red: string;
  vignette: string;
};

function Defs({ ids }: { ids: Ids }) {
  const glow = (id: string, color: string) => (
    <radialGradient id={id}>
      <stop offset="0" stopColor={color} stopOpacity="0.55" />
      <stop offset="1" stopColor={color} stopOpacity="0" />
    </radialGradient>
  );
  return (
    <defs>
      <pattern id={ids.dots} width="1.25" height="1.25" patternUnits="userSpaceOnUse">
        <circle cx="0.625" cy="0.625" r="0.3" className="sa-dot" />
      </pattern>
      <pattern id={ids.dim} width="1.25" height="1.25" patternUnits="userSpaceOnUse">
        <circle cx="0.625" cy="0.625" r="0.22" className="sa-dot is-dim" />
      </pattern>
      {/* Dark windows on far towers: the grid reads as "people live here" without a single lit room. */}
      <pattern id={ids.win} width="2.4" height="3" patternUnits="userSpaceOnUse">
        <rect x="0.5" y="0.6" width="1.1" height="1.5" className="sa-dot is-dim" />
      </pattern>
      <pattern id={ids.tile} width="2.5" height="2.5" patternUnits="userSpaceOnUse">
        <path d="M0 0 H2.5 M0 0 V2.5" className="sa-tile-line" />
      </pattern>
      <pattern id={ids.hatch} width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect width="1.4" height="3" className="sa-hatch-bar" />
      </pattern>
      <linearGradient id={ids.fog} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" className="sa-fog-stop" stopOpacity="0" />
        <stop offset="0.55" className="sa-fog-stop" stopOpacity="0.5" />
        <stop offset="1" className="sa-fog-stop" stopOpacity="0" />
      </linearGradient>
      {glow(ids.teal, "var(--signal)")}
      {glow(ids.warm, "var(--alarm)")}
      {glow(ids.red, "var(--omni)")}
      <radialGradient id={ids.vignette} cx="0.5" cy="0.42" r="0.75">
        <stop offset="0.55" stopColor="var(--bg-deep)" stopOpacity="0" />
        <stop offset="1" stopColor="var(--bg-deep)" stopOpacity="0.9" />
      </radialGradient>
    </defs>
  );
}

/** Drifting fog and floating dust, on every scene. `low` is where the fog sits (frame units). */
function Air({ ids, low = 52 }: { ids: Ids; low?: number }) {
  const motes = [[22, 30], [41, 18], [63, 44], [88, 26], [104, 40], [127, 22], [146, 34], [74, 12]];
  return (
    <g className="sa-air" aria-hidden="true">
      <rect className="sa-fog" x="-20" y={low - 14} width="200" height="34" fill={`url(#${ids.fog})`} />
      <rect className="sa-fog is-slow" x="-20" y={low - 26} width="200" height="26" fill={`url(#${ids.fog})`} />
      {motes.map(([x, y], i) => (
        <circle key={i} className="sa-mote" cx={x} cy={y} r="0.25" style={{ ["--i" as string]: i }} />
      ))}
      <rect x="0" y="0" width="160" height="90" fill={`url(#${ids.vignette})`} />
    </g>
  );
}

const Glow = ({ x, y, r, fill, className = "" }: { x: number; y: number; r: number; fill: string; className?: string }) => (
  <circle className={`sa-glow ${className}`} cx={x} cy={y} r={r} fill={`url(#${fill})`} />
);

/** A cable sagging between two points. */
const cable = (x1: number, y1: number, x2: number, y2: number, sag: number) =>
  `M${x1} ${y1} Q${(x1 + x2) / 2} ${Math.max(y1, y2) + sag} ${x2} ${y2}`;

/** A light's pool on the floor under it. */
const Pool = ({ x, y, rx, ry, fill, className = "" }: { x: number; y: number; rx: number; ry: number; fill: string; className?: string }) => (
  <ellipse className={`sa-glow ${className}`} cx={x} cy={y} rx={rx} ry={ry} fill={`url(#${fill})`} />
);

/*
 * Props are drawn once in their own coordinates (units noted on each) and
 * placed with `at`/`scale`, so a figure keeps its proportions wherever it stands.
 */

/** A wall camera: bracket, arm, housing under a sun hood, lens, red eye. Faces right; 12×6 units. */
const Camera = ({ x, y, flip = false, scale = 0.45 }: { x: number; y: number; flip?: boolean; scale?: number }) => (
  <g transform={`translate(${x} ${y}) scale(${flip ? -scale : scale} ${scale})`}>
    <rect className="sa-metal" x="-0.8" y="-1.6" width="1.6" height="3.6" rx="0.3" />
    <path className="sa-metal" d="M0.6 -0.2 L3.2 1.2 L2.8 2 L0.4 0.8 Z" />
    <path className="sa-metal" d="M2.6 0.4 L10.4 1.6 C10.8 1.7 11 2 11 2.4 L11 4.4 C11 4.8 10.7 5 10.3 4.9 L2.6 3.8 C2.2 3.7 2 3.4 2 3 L2 1 C2 0.6 2.2 0.3 2.6 0.4 Z" />
    <path className="sa-metal" d="M1.6 -0.6 L11.6 0.9 L11.6 1.7 L1.6 0.3 Z" />
    <path className="sa-rim" d="M2.6 0.9 L10.4 2" />
    <path className="sa-line" d="M4 2.2 V3.6 M5 2.4 V3.7 M6 2.5 V3.8" />
    <circle className="sa-lens" cx="11" cy="3.4" r="0.9" />
    <circle className="sa-redlight" cx="11" cy="3.4" r="0.38" />
  </g>
);

/**
 * A quadcopter drone, three-quarter view: hull with a seam, four motor arms,
 * blurred rotor discs that flutter, a sensor dome with its red lens, skids, an antenna.
 * Centred on its hull; 26×12 units.
 */
const Drone = ({ x, y, scale }: { x: number; y: number; scale: number }) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <path className="sa-arm" d="M-4 -0.6 L-11 -2.4 M4 -0.6 L11 -2.4 M-3 0.6 L-7.6 -0.6 M3 0.6 L7.6 -0.6" />
    {[[-11, -2.4, 5.2], [11, -2.4, 5.2], [-7.6, -0.6, 3.6], [7.6, -0.6, 3.6]].map(([cx, cy, r], i) => (
      <g key={i}>
        <rect className="sa-metal" x={cx - 1} y={cy - 1.2} width="2" height="1.8" rx="0.5" />
        <ellipse className="sa-rotor" cx={cx} cy={cy - 1.6} rx={r} ry={r * 0.12} style={{ ["--i" as string]: i }} />
        <path className="sa-blade" d={`M${cx - r * 0.9} ${cy - 1.6} H${cx + r * 0.9}`} style={{ ["--i" as string]: i }} />
      </g>
    ))}
    <path className="sa-metal" d="M-5.4 -0.8 C-5.4 -3.2 -3 -4 0 -4 C3 -4 5.4 -3.2 5.4 -0.8 L4.6 1.4 C3.2 2.6 -3.2 2.6 -4.6 1.4 Z" />
    <path className="sa-rim" d="M-4.8 -2 C-3.4 -3.4 3.4 -3.4 4.8 -2" />
    <path className="sa-line" d="M-5 0 H5 M-1.6 -3.8 V-0.2 M1.6 -3.8 V-0.2" />
    <path className="sa-line" d="M2.4 -3.8 L3.6 -6.2" />
    <circle className="sa-redlight" cx="3.7" cy="-6.4" r="0.4" />
    <path className="sa-metal" d="M-2.4 2 A2.4 2.4 0 0 0 2.4 2 Z" />
    <circle className="sa-lens" cx="0" cy="3" r="1.1" />
    <circle className="sa-redlight" cx="0" cy="3" r="0.5" />
    <path className="sa-line is-strong" d="M-3.4 2 L-4.6 4.4 M3.4 2 L4.6 4.4 M-6.4 4.4 H-2.8 M2.8 4.4 H6.4" />
  </g>
);

/**
 * The courier, lying face down at the end of the platform: head turned to the floor,
 * one arm reaching ahead, a long coat over the back, a satchel, legs, boots.
 * The gate's light catches the line of the back; the chip on the neck still blinks.
 * Feet to the right, ground at y=10; 40×10 units.
 */
const Courier = ({ x, y, scale }: { x: number; y: number; scale: number }) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`}>
    {/* The gate's light spilling on the floor behind the body. */}
    <ellipse className="sa-glow" cx="16" cy="10" rx="22" ry="2.2" fill="var(--signal)" fillOpacity="0.08" />
    <ellipse className="sa-shadow" cx="20" cy="10" rx="21" ry="0.9" />
    {/* Arm reaching ahead along the floor, fingers open. */}
    <path className="sa-figure" d="M10.6 6.6 C8 7 5 8.2 2.4 8.7 L0.6 8.9 C-0.2 9 -0.3 9.9 0.5 9.95 L3 9.9 C5.6 9.8 8.6 9.3 11 8.6 Z" />
    <path className="sa-figure" d="M0.2 9.95 L-0.8 9.4 M0.4 9.95 L-0.9 9.9" />
    {/* Head, face to the floor, hair falling forward. */}
    <path className="sa-figure" d="M4.4 9.9 C3.6 8.6 3.8 6.4 5.6 5.6 C7.4 4.8 9.4 5.6 9.8 7.4 C10.1 8.6 9.6 9.9 8.6 9.9 Z" />
    <path className="sa-figure" d="M4.2 8.8 C3.6 9.4 3.4 9.9 3.2 9.95 L4.6 9.95 Z" />
    {/* Coat over the back, its hem fanned at the hips; the other arm tucked under. */}
    <path className="sa-figure" d="M8.6 9.9 C8.6 7.2 10 5.4 13 4.9 C17 4.2 22 4.3 26 4.9 C28.6 5.3 30.6 6.6 31.4 8.4 L32 9.9 Z" />
    <path className="sa-figure" d="M25 5 C28 4.6 31.6 5.6 33.4 8.2 L34 9.9 L27 9.9 Z" />
    {/* Legs and boots, one knee a little bent. */}
    <path className="sa-figure" d="M31 7.6 C33.4 7.2 35.8 7.4 37.6 7.9 L37.6 9.9 L31 9.9 Z" />
    <path className="sa-figure" d="M37 7.2 C38.6 6.9 40 7.5 40.4 8.6 L40.6 9.9 L37 9.9 Z" />
    <path className="sa-figure" d="M30 8.6 C32 8 34.2 8.2 35.6 8.9 L35.4 9.9 L30 9.9 Z" />
    {/* The satchel, its strap across the back. */}
    <path className="sa-figure" d="M17.4 4.6 L22.6 4.4 C23.2 4.4 23.6 4.8 23.5 5.4 L23.3 6.2 L17.2 6.4 Z" />
    <path className="sa-figure-line" d="M12.4 5.2 L18.2 4.6 M26.4 5.4 C28.4 6.4 29.8 7.8 30.4 9.6 M33.8 8.4 L33.6 9.9 M38.6 7.2 L38.4 9.9" />
    {/* Light from the gate along the back and the head. */}
    <path className="sa-rim is-teal" d="M6 5.7 C7.4 5 9 5.3 9.6 6.6 M10.6 5.9 C12.4 4.8 16 4.3 17.4 4.6 M23.4 4.6 C27 4.6 30.6 5.4 33 7.6 M37.2 7.2 C38.4 6.9 39.6 7.3 40.2 8.2" />
    <circle className="sa-chip" cx="10" cy="6.5" r="0.45" />
  </g>
);

/** An office chair, empty: tall back, seat, armrest, gas lift, a five-star base on wheels. Faces left; 6×12 units. */
const Chair = ({ x, y, scale }: { x: number; y: number; scale: number }) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <path className="sa-metal" d="M3.4 0.2 C3.8 -0.2 5.6 -0.2 6 0.4 L5.8 6.2 C5.7 6.8 4 6.9 3.6 6.4 Z" />
    <path className="sa-rim is-warm" d="M3.6 0.4 C4.2 0 5.4 0 5.8 0.5" />
    <path className="sa-metal" d="M0.2 7 C0.2 6.4 5.8 6.4 6 7 L5.8 8 C5.6 8.4 0.6 8.4 0.4 8 Z" />
    <path className="sa-line is-strong" d="M4.6 6.6 V5.6 H1.6 M3 8.3 V10.6 M0.4 11 L3 10.6 L5.6 11 M1.4 11.3 L3 10.6 L4.6 11.3" />
    <circle className="sa-metal" cx="0.4" cy="11.4" r="0.45" />
    <circle className="sa-metal" cx="5.6" cy="11.4" r="0.45" />
    <circle className="sa-metal" cx="3" cy="11.6" r="0.45" />
  </g>
);

/** A metal stool: round seat with a lip, three splayed legs, a foot ring. 12×9 units. */
const Stool = ({ x, y, scale }: { x: number; y: number; scale: number }) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <path className="sa-line is-strong" d="M2 1.6 L0.4 8.8 M10 1.6 L11.6 8.8 M6 2 V9" />
    <ellipse className="sa-line" cx="6" cy="5.8" rx="4.8" ry="0.8" />
    <ellipse className="sa-metal" cx="6" cy="1.2" rx="5.6" ry="1.2" />
    <path className="sa-metal" d="M0.4 1.2 V1.9 C0.4 2.6 11.6 2.6 11.6 1.9 V1.2" />
    <path className="sa-rim is-warm" d="M1 0.8 C3 0.1 9 0.1 11 0.8" />
  </g>
);

/** One-point perspective box: back wall, side walls and ceiling lines toward the far wall's corners. */
function Room({ ids, back: [x0, y0, x1, y1] }: { ids: Ids; back: [number, number, number, number] }) {
  return (
    <g>
      <polygon points={`0,0 ${x0},${y0} ${x0},${y1} 0,90`} fill={`url(#${ids.dim})`} />
      <polygon points={`160,0 ${x1},${y0} ${x1},${y1} 160,90`} fill={`url(#${ids.dim})`} />
      <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} fill={`url(#${ids.dots})`} className="sa-far" />
      <path className="sa-edge" d={`M0 0 L${x0} ${y0} M160 0 L${x1} ${y0} M0 90 L${x0} ${y1} M160 90 L${x1} ${y1}`} />
      <rect className="sa-edge" x={x0} y={y0} width={x1 - x0} height={y1 - y0} />
    </g>
  );
}

const TangHam = ({ ids }: { ids: Ids }) => {
  // Floor boards run toward the far wall's foot.
  const boards = Array.from({ length: 11 }, (_, i) => -40 + i * 24).map((x) => `M${x} 90 L${50 + ((x + 40) / 240) * 60} 56`).join(" ");
  // Stairs up the left wall to a door with light under it.
  const stairs = Array.from({ length: 7 }, (_, i) => {
    const x = 6 + i * 4.6;
    const y = 82 - i * 6;
    return `M${x} ${y} H${x + 4.6} V${y - 6}`;
  }).join(" ");
  return (
    <>
      <Room ids={ids} back={[50, 22, 110, 56]} />
      {/* Cracks and a water stain on the far wall. */}
      <path className="sa-crack" d="M58 22 L60 27 L58.6 31 L61 36 M97 56 L95 50 L97.4 46 L96 41" />
      <ellipse cx="88" cy="26" rx="7" ry="3" fill={`url(#${ids.dim})`} />
      <path className="sa-line" d={boards} />
      {/* Pipes on the ceiling with joints and a valve; one drips. */}
      <path className="sa-line is-strong" d="M0 6 L50 24.5 M0 9.5 L50 25.8 M160 7 L110 24.8" />
      <path className="sa-line" d="M14 9.2 V12.6 M30 15 V18.4 M42 19.4 V22.4 M132 15.6 V18.6" />
      <circle className="sa-line" cx="24" cy="15.4" r="1.6" />
      <path className="sa-line" d="M22.4 15.4 H25.6 M24 13.8 V17" />
      <circle className="sa-drip" cx="34" cy="17.6" r="0.35" />
      <ellipse className="sa-splash" cx="34" cy="80" rx="2" ry="0.4" />
      <path className="sa-line" d={stairs} />
      <path className="sa-line" d="M6 82 L38 46" />
      <rect className="sa-edge" x="38" y="26" width="7" height="14" />
      <line className="sa-doorlight sa-flicker is-slow" x1="38.4" y1="39.6" x2="44.6" y2="39.6" />
      {/* A fuse box with a red pip; a mattress and a crate: Kai's whole room. */}
      <rect className="sa-metal" x="99" y="30" width="6" height="8" />
      <circle className="sa-redlight" cx="102" cy="32" r="0.35" />
      <path className="sa-line" d="M102 38 V56" />
      <polygon points="112,61 138,61 146,72 106,72" fill={`url(#${ids.dots})`} />
      <path className="sa-edge" d="M112 61 L138 61 L146 72 L106 72 Z M110 66 Q124 63 141 66 M108 69 Q122 67 144 69" />
      <rect x="20" y="62" width="14" height="10" fill={`url(#${ids.dots})`} />
      <path className="sa-edge" d="M20 62 h14 v10 h-14 Z M20 62 l3 -2.4 h14 l-3 2.4 M37 59.6 v10 l-3 2.4" />
      {/* The bulb on its wire, and its pool on the floor. */}
      <path className="sa-line" d={cable(70, 22.6, 70.4, 31, 1)} />
      <Glow x={70} y={32} r={18} fill={ids.warm} className="sa-flicker" />
      <circle className="sa-bulb sa-flicker" cx="70.4" cy="32" r="0.9" />
      <Pool x={70} y={66} rx={20} ry={3.4} fill={ids.warm} className="sa-flicker" />
      {/* The floor hatch over the laptop: light leaks through its seams. */}
      <Glow x={80} y={62} r={13} fill={ids.teal} className="sa-breathe" />
      <polygon className="sa-hatch sa-breathe" points="74,59.4 86,59.4 88,65.6 72,65.6" />
      <path className="sa-seam sa-breathe" d="M74 59.4 H86 L88 65.6 H72 Z M80 59.4 V65.6" />
      <Air ids={ids} low={66} />
    </>
  );
};

const RAILING = "M0 90 V60 H12 V55 H24 V61 H38 V52 H50 V57 H68 V53 H86 V58 H102 V50 H118 V56 H132 V52 H148 V59 H160 V90 Z";

const TramR17 = ({ ids }: { ids: Ids }) => (
  <>
    {/* A pale moon low in the haze, and the towers under it. */}
    <circle cx="124" cy="22" r="10" fill={`url(#${ids.dim})`} />
    <circle className="sa-moon" cx="124" cy="22" r="10" />
    <path d="M0 50 V36 H8 V28 H18 V38 H30 V24 H38 V40 H76 V30 H90 V38 H112 V20 H122 V36 H140 V28 H160 V50 Z" fill={`url(#${ids.win})`} className="sa-far" />
    <g transform="translate(0 -9)">
      <path d={RAILING} fill={`url(#${ids.dots})`} />
      <path className="sa-edge" d={RAILING} />
      {/* Roof clutter: a water tank, AC boxes, a dish, a line of washing that never dries. */}
      <rect className="sa-metal" x="16" y="48" width="7" height="6" />
      <ellipse className="sa-metal" cx="19.5" cy="48" rx="3.5" ry="0.8" />
      <path className="sa-line" d="M17 54 V55 M22 54 V55" />
      <rect className="sa-metal" x="88" y="49.4" width="5" height="3.6" />
      <rect className="sa-metal" x="126" y="47" width="4" height="3" />
      <path className="sa-line" d="M138 51 l3 -3 M138.4 48 a2.4 2.4 0 0 0 3.4 3.4" />
      <path className="sa-line" d={`M98 50 V44 M116 49 V42 ${cable(98, 44, 116, 42, 2)}`} />
      <g className="sa-sway">
        <path className="sa-cloth" d="M101 44.9 h2.6 v3.4 h-2.6 Z M106 45.5 h3.4 v2.6 h-3.4 Z M111.6 44.6 h2 v4 h-2 Z" />
      </g>
    </g>
    {/* The relay mast: lattice legs, guy wires, a dish, the beacon. */}
    <path className="sa-line is-strong" d="M54 45 L58 14 L62 48" />
    <path className="sa-line" d="M54.6 40 L61.4 37 L55.2 34 L60.8 31 L55.8 28 L60.2 25 L56.4 22 L59.6 19.5 L57 17" />
    <path className="sa-line" d="M58 18 L36 47 M58 18 L84 48 M58 26 L44 48" />
    <ellipse className="sa-metal" cx="63.4" cy="27" rx="1.6" ry="2.6" transform="rotate(-20 63.4 27)" />
    <path className="sa-line" d="M59 27 H62" />
    {[0, 1, 2].map((i) => (
      <circle key={i} className="sa-ring" cx="58" cy="14" r="22" style={{ ["--i" as string]: i }} />
    ))}
    <circle className="sa-redlight" cx="58" cy="13.4" r="0.6" />
    {/* A few rooms still lit below. */}
    {[[16, 54], [44, 51], [90, 53], [121, 50], [138, 55], [70, 52]].map(([x, y], i) => (
      <rect key={i} className={`sa-window${i === 2 ? " sa-flicker" : ""}`} x={x} y={y} width="1.4" height="1.8" />
    ))}
    <Air ids={ids} low={48} />
  </>
);

const TramKhauPhan = ({ ids }: { ids: Ids }) => (
  <>
    <path d="M0 24 V8 H20 V14 H44 V4 H70 V12 H96 V6 H124 V14 H160 V24 Z" fill={`url(#${ids.win})`} className="sa-far" />
    <path className="sa-line" d={`${cable(0, 22, 80, 20, 4)} ${cable(80, 20, 160, 23, 3)}`} />
    {[14, 48, 82, 116].map((x, k) => (
      <g key={x}>
        {/* A blank board over each kiosk; only the open one is lit. */}
        <rect className={k === 2 ? "sa-board is-lit" : "sa-board"} x={x + 4} y="17" width="22" height="5" />
        <rect x={x} y="24" width="30" height="34" fill={`url(#${ids.dots})`} />
        <path className="sa-edge" d={`M${x - 2} 24 H${x + 32} M${x} 24 V58 M${x + 30} 24 V58 M${x - 2} 24 L${x} 26.4 H${x + 30} L${x + 32} 24`} />
        {Array.from({ length: k === 2 ? 3 : 7 }, (_, i) => (
          <line key={i} className="sa-line" x1={x + 1} x2={x + 29} y1={(k === 2 ? 46 : 30) + i * 4} y2={(k === 2 ? 46 : 30) + i * 4} />
        ))}
        {/* Torn notices on the posts. */}
        {k !== 2 && <path className="sa-notice" d={`M${x + 31} ${32 + k * 3} h2.6 v4 l-1 -0.8 h-1.6 Z`} />}
      </g>
    ))}
    {/* The open kiosk: a card reader, a slot, a counter. */}
    <path className="sa-metal" d="M84 44 H110 V46 H84 Z" />
    <Glow x={97} y={38} r={11} fill={ids.teal} className="sa-breathe" />
    <rect className="sa-screen" x="94.5" y="34.5" width="5" height="7" />
    <path className="sa-line" d="M95.4 43 H98.6" />
    {/* The queue: posts and sagging ropes leading to the open window. */}
    {[[64, 66], [74, 63], [84, 61], [116, 61], [126, 63], [136, 66]].map(([x, y], i) => (
      <rect key={i} className="sa-metal" x={x} y={y - 4} width="0.9" height="4" />
    ))}
    <path className="sa-rope" d={`${cable(64.4, 62.6, 74.4, 59.6, 1.4)} ${cable(74.4, 59.6, 84.4, 57.6, 1.2)} ${cable(116.4, 57.6, 126.4, 59.6, 1.2)} ${cable(126.4, 59.6, 136.4, 62.6, 1.4)}`} />
    <path className="sa-line" d="M0 58 H160 M97 58 L80 90 M97 58 L116 90" />
    <Camera x={6.4} y={16} scale={0.5} />
    <path className="sa-line is-strong" d="M6 16 V58" />
    {/* A ration drone crossing slowly, its eye and a thin cone sweeping the ground. */}
    <g className="sa-drone">
      <polygon className="sa-cone is-red" points="-1.4,17.6 1.4,17.6 8,46 -8,46" />
      <Drone x={0} y={16.4} scale={0.32} />
    </g>
    <Air ids={ids} low={62} />
  </>
);

const GaNgam = ({ ids }: { ids: Ids }) => {
  const left = [[18, 0, 9, 84], [48, 12, 5, 52], [63, 22, 3.4, 33], [72, 28, 2.4, 22], [78, 32, 1.7, 15]];
  const right = [[130, 4, 9, 80], [110, 16, 5, 46], [100, 24, 3.2, 30], [95, 29, 2.2, 20]];
  // Sleepers across the track, closer together as they recede.
  const sleepers = [0.08, 0.22, 0.36, 0.5, 0.62, 0.72, 0.8, 0.87, 0.92].map((t) => {
    const x1 = t * 82;
    return `M${x1} ${74 - t * 28.4} L${x1 + 2 + (1 - t) * 6} ${84 - t * 37.6}`;
  }).join(" ");
  return (
    <>
      <Room ids={ids} back={[82, 30, 104, 47]} />
      <polygon points="0,0 82,30 82,47 0,74" fill={`url(#${ids.tile})`} />
      <polygon points="160,0 104,30 104,47 160,86" fill={`url(#${ids.tile})`} />
      {/* Ceiling beams across the vault. */}
      <path className="sa-edge" d="M30 11 H136 M58 21 H118 M71 26 H110 M77 28.4 H106" />
      <path className="sa-line" d="M0 74 L82 45.6 M0 84 L82 46.4" />
      <path className="sa-line" d={sleepers} />
      <polygon points="36,90 84,47 104,47 160,86 160,90" fill={`url(#${ids.dim})`} />
      <path className="sa-dash is-warm" d="M38 89 L84 47.4" />
      {[...left, ...right].map(([x, y, w, h], i) => (
        <g key={i}>
          <rect x={x} y={y} width={w} height={h} fill={`url(#${ids.dots})`} />
          <rect className="sa-edge" x={x} y={y} width={w} height={h} />
        </g>
      ))}
      {/* A bench by the pillar, a bin, the gate's glow on the wet floor. */}
      <path className="sa-metal" d="M114 62 H126 V63 H114 Z" />
      <path className="sa-line" d="M115 63 V66 M125 63 V66 M114 58 H126" />
      <rect className="sa-metal" x="106" y="58" width="2.6" height="3.6" />
      <polygon className="sa-floorglow sa-breathe" points="88,47 98,47 112,62 74,62" />
      {[[60, 7.5, 6], [76, 17, 4], [86, 23, 2.6], [92, 26.5, 1.6]].map(([x, y, w], i) => (
        <rect key={i} className={`sa-tube${i === 1 ? " sa-flicker" : ""}`} x={x} y={y} width={w} height="0.6" />
      ))}
      {/* One lamp has come loose and swings on its cable. */}
      <g className="sa-swing">
        <line className="sa-line" x1="120" y1="11" x2="120" y2="18" />
        <rect className="sa-tube sa-flicker" x="117.6" y="18" width="4.8" height="0.6" />
      </g>
      {/* The scanner gate, and past it, the courier lying at the end of the platform. */}
      <Glow x={93} y={40} r={13} fill={ids.teal} className="sa-breathe" />
      <rect className="sa-curtain" x="87" y="32" width="12" height="15" />
      <rect className="sa-gate" x="87" y="32" width="12" height="15" />
      <path className="sa-line" d="M87 34 H99" />
      <Courier x={86.6} y={43.4} scale={0.33} />
      <Air ids={ids} low={58} />
    </>
  );
};

const CongBac = ({ ids }: { ids: Ids }) => {
  const fence = (x0: number, x1: number) =>
    Array.from({ length: 9 }, (_, i) => x0 + ((x1 - x0) * i) / 8).map((x) => `M${x} 40 V64`).join(" ");
  return (
    <>
      {/* The city on the other side, lit and far away. */}
      <path d="M60 56 V44 H66 V36 H72 V46 H78 V34 H84 V45 H90 V40 H98 V56 Z" fill={`url(#${ids.win})`} className="sa-far" />
      {[[64, 43], [70, 39], [81, 37], [88, 44], [94, 42], [75, 48]].map(([x, y], i) => (
        <circle key={i} className="sa-citylight" cx={x} cy={y} r="0.35" style={{ ["--i" as string]: i }} />
      ))}
      {/* Fence wings out to the edges. */}
      <path className="sa-line" d={`${fence(0, 38)} ${fence(122, 160)} M0 40 H38 M122 40 H160 M0 52 H38 M122 52 H160`} />
      <path className="sa-wire" d="M0 39 q2 -1.4 4 0 t4 0 t4 0 t4 0 t4 0 t4 0 t4 0 t4 0 t4 0 M122 39 q2 -1.4 4 0 t4 0 t4 0 t4 0 t4 0 t4 0 t4 0 t4 0 t4 0 t4 0" />
      {/* Two pylons: plates, vents, red strips. */}
      <polygon points="40,8 60,6 62,66 38,66" fill={`url(#${ids.dots})`} />
      <polygon points="100,6 120,8 122,66 98,66" fill={`url(#${ids.dots})`} />
      <path className="sa-edge" d="M40 8 L60 6 L62 66 L38 66 Z M100 6 L120 8 L122 66 L98 66 Z M39.4 22 H60.6 M39 40 H61.2 M99.4 22 H120.6 M98.8 40 H121.2" />
      <path className="sa-line" d="M44 28 H52 M44 30 H52 M44 32 H52 M108 28 H116 M108 30 H116 M108 32 H116" />
      <path className="sa-omni-strip" d="M57 12 V60 M103 12 V60 M44 10 H56 M104 10 H116" />
      <Camera x={60} y={6} />
      <Camera x={100} y={6} flip />
      {/* The barrier arm, raised; the gate's scan line sweeping the opening. */}
      <path className="sa-metal" d="M62 60 L64 60 L64 64 L62 64 Z" />
      <path className="sa-line is-strong" d="M63 60 L74 36" />
      <path className="sa-hatchline" d="M63.6 58.8 L74 36" />
      <line className="sa-scanline" x1="61" y1="20" x2="99" y2="20" />
      <path className="sa-line" d="M62 66 L20 90 M98 66 L140 90" />
      <path className="sa-dash" d="M80 66 V90" />
      <path className="sa-reflect" d="M57 70 V82 M103 70 V82" />
      <Air ids={ids} low={62} />
    </>
  );
};

const VanhDaiDien = ({ ids }: { ids: Ids }) => {
  const posts = [[12, 8, 72], [36, 16, 58], [54, 22, 50], [68, 26, 45], [79, 29, 42], [87, 31, 40], [93, 32.5, 39]];
  // Three wires sagging from post to post.
  const wires = [0, 1, 2]
    .map((k) =>
      posts.slice(0, -1).map(([x, top], i) => {
        const [x2, top2] = posts[i + 1];
        const y1 = top + 4 + k * (14 - i * 1.7);
        const y2 = top2 + 4 + k * (14 - (i + 1) * 1.7);
        return cable(x, y1, x2, y2, 2.4 - i * 0.3);
      }).join(" "),
    )
    .join(" ");
  return (
    <>
      <path d="M0 42 H160" className="sa-edge" />
      <path d="M96 42 V36 H104 V32 H112 V38 H126 V34 H140 V40 H160 V42 Z" fill={`url(#${ids.dim})`} className="sa-far" />
      {/* A substation far off: boxes, a transformer, one red lamp. */}
      <path className="sa-line" d="M120 42 V34 H128 V42 M131 42 V36 H137 V42 M129 34 V30 M133 36 V31 M127 30 H135" />
      <circle className="sa-redlight" cx="133" cy="30.6" r="0.4" style={{ ["--i" as string]: 3 }} />
      <path className="sa-line is-strong" d={wires} />
      {posts.map(([x, top, bottom], i) => {
        const w = 3.6 - i * 0.45;
        return (
          <g key={i}>
            <rect x={x - w / 2} y={top} width={w} height={bottom - top} fill={`url(#${ids.dots})`} />
            <rect className="sa-edge" x={x - w / 2} y={top} width={w} height={bottom - top} />
            <path className="sa-line" d={`M${x - w} ${top + 3} H${x + w} M${x - w} ${top + 3 + (14 - i * 1.7)} H${x + w}`} />
            <circle className="sa-redlight" cx={x} cy={top - 0.8} r={0.55 - i * 0.05} style={{ ["--i" as string]: i }} />
          </g>
        );
      })}
      {/* A warning plate on the nearest post: a bolt, no words. */}
      <path className="sa-plate" d="M8 30 L12 23 L16 30 Z" />
      <path className="sa-bolt" d="M12.4 24.6 L11 27.4 H12.6 L11.6 29.4" />
      {/* Arcs jumping between the wires, never in the same place twice in a row. */}
      {[["M13 13 L20 18 L17 20 L26 24 L23 26 L35 31", 0], ["M37 36 L42 33 L45 37 L50 34 L53 38", 1], ["M55 28 L59 31 L62 29 L67 32", 2]].map(([d, i]) => (
        <path key={i} className="sa-arc" d={d as string} style={{ ["--i" as string]: i }} />
      ))}
      {/* Dead weeds in the foreground. */}
      <path className="sa-weeds" d="M0 90 L0 80 L2 74 L3 81 L5 70 L6 80 L9 76 L10 82 L13 72 L14 82 L18 78 L19 84 L24 79 L25 90 Z M136 90 L138 82 L140 78 L141 83 L144 75 L145 83 L149 79 L150 84 L154 74 L155 84 L160 80 L160 90 Z" />
      <Air ids={ids} low={50} />
    </>
  );
};

const TramThamVan = ({ ids }: { ids: Ids }) => (
  <>
    <Room ids={ids} back={[44, 14, 116, 62]} />
    {/* Panel seams, a vent, a speaker grille. */}
    <path className="sa-edge" d="M62 14 V62 M98 14 V62 M44 38 H62 M98 38 H116" />
    <rect className="sa-metal" x="104" y="17" width="9" height="4" />
    <path className="sa-line" d="M105 18 H112 M105 19 H112 M105 20 H112" />
    {[0, 1, 2, 3, 4, 5].map((i) => (
      <circle key={i} className="sa-rivet" cx={52 + (i % 3) * 1.6} cy={22 + Math.floor(i / 3) * 1.6} r="0.35" />
    ))}
    {/* A one-way mirror on the left wall, something faint moving behind it. */}
    <polygon className="sa-mirror" points="10,22 34,26 34,52 10,58" />
    <path className="sa-glass" d="M14 26 L22 27.4 L14 40 Z" />
    <path className="sa-edge" d="M10 22 L34 26 L34 52 L10 58 Z" />
    {/* The lamp: a shade on its cable, the cone, the stool, a drain under it. */}
    <path className="sa-line" d="M80 14 V16" />
    <path className="sa-metal" d="M77 16 H83 L85 18 H75 Z" />
    <polygon className="sa-cone sa-flicker" points="75.4,18 84.6,18 98,64 62,64" />
    <Pool x={80} y={64} rx={18} ry={2.8} fill={ids.warm} className="sa-flicker" />
    <Stool x={73.4} y={58.8} scale={1.1} />
    <ellipse className="sa-edge" cx="80" cy="70.4" rx="2" ry="0.5" />
    {/* The wall's eye: an aperture in rings, an iris that looks around. */}
    <Glow x={104} y={32} r={11} fill={ids.red} className="sa-breathe" />
    <g className="sa-eye">
      <circle className="sa-eye-ring" cx="104" cy="32" r="5.4" />
      <circle className="sa-edge" cx="104" cy="32" r="4.2" />
      <path className="sa-edge" d="M104 26.6 V28.4 M104 35.6 V37.4 M98.6 32 H100.4 M107.6 32 H109.4 M100.2 28.2 L101.4 29.4 M106.6 34.6 L107.8 35.8 M107.8 28.2 L106.6 29.4 M101.4 34.6 L100.2 35.8" />
      <g className="sa-look">
        <circle className="sa-eye-iris" cx="104" cy="32" r="2.4" />
        <circle className="sa-eye-pupil" cx="104" cy="32" r="0.8" />
      </g>
    </g>
    <path className="sa-line" d="M104 37.4 V62" />
    <Air ids={ids} low={70} />
  </>
);

const CongKiemSoat = ({ ids }: { ids: Ids }) => (
  <>
    {/* Blocks on both sides, windows dark, one roof antenna. */}
    <path d="M0 66 V20 H9 V16 H18 V24 H28 V14 H34 V66 Z" fill={`url(#${ids.dim})`} />
    <path d="M0 66 V20 H9 V16 H18 V24 H28 V14 H34 V66 Z" fill={`url(#${ids.win})`} className="sa-far" />
    <path className="sa-line" d="M14 16 V8 M12 10 H16 M28 14 L31 9" />
    <path d="M150 36 V18 H160 V36 Z" fill={`url(#${ids.win})`} className="sa-far" />
    <path className="sa-line" d={`${cable(0, 26, 38, 20, 5)} ${cable(0, 30, 38, 24, 6)}`} />

    {/* The Control Gate: a wall of plates, two leaves, red strips on its frame, cameras on its shoulders. */}
    <rect x="38" y="12" width="82" height="54" fill={`url(#${ids.dots})`} />
    <rect className="sa-edge" x="38" y="12" width="82" height="54" />
    <path className="sa-edge" d="M38 20 H120 M38 28 H50 M108 28 H120 M38 40 H50 M108 40 H120 M38 52 H50 M108 52 H120 M44 12 V20 M114 12 V20" />
    <rect className="sa-gate-door" x="50" y="20" width="58" height="46" />
    <path className="sa-edge" d="M50 32 H108 M50 44 H108 M50 56 H108 M64 20 V66 M94 20 V66" />
    <line className="sa-line is-strong" x1="79" y1="20" x2="79" y2="66" />
    {[24, 36, 48, 60].map((y) => (
      <path key={y} className="sa-rivets" d={`M52 ${y} h0.01 M62 ${y} h0.01 M96 ${y} h0.01 M106 ${y} h0.01`} />
    ))}
    <rect x="50" y="62" width="58" height="4" fill={`url(#${ids.hatch})`} />
    <path className="sa-omni-strip" d="M52 18 H72 M86 18 H106 M48 24 V60 M110 24 V60" />
    <Camera x={40} y={10} flip />
    <Camera x={118} y={10} />

    {/* Floodlights over the apron. */}
    <path className="sa-line" d="M60 12 V9 H66 V12 M92 12 V9 H98 V12" />
    <polygon className="sa-cone" points="61,12 65,12 76,70 46,70" />
    <polygon className="sa-cone" points="93,12 97,12 112,70 82,70" />
    <Pool x={63} y={70} rx={16} ry={2.6} fill={ids.warm} />
    <Pool x={95} y={70} rx={16} ry={2.6} fill={ids.warm} />

    {/* The guard booth: roof, glass, desk, a monitor still on, a chair, nobody. */}
    <Glow x={136} y={50} r={15} fill={ids.warm} className="sa-flicker is-slow" />
    <rect className="sa-metal" x="122.5" y="35.5" width="25" height="2.4" />
    <rect className="sa-booth-light sa-flicker is-slow" x="126" y="40" width="18" height="15" />
    <rect className="sa-edge is-warm" x="124" y="38" width="22" height="28" />
    <path className="sa-edge is-warm" d="M135 38 V55 M126 55 H144" />
    <path className="sa-glass" d="M127 41 L131 41 L128 47 Z" />
    <path className="sa-line is-strong" d="M127 55 H141 M128 55 V60 M140 55 V60" />
    <rect className="sa-screen sa-breathe" x="129" y="51.6" width="3.4" height="2.4" />
    <Chair x={136.4} y={47.4} scale={0.9} />
    <Pool x={135} y={67} rx={12} ry={1.8} fill={ids.warm} className="sa-flicker is-slow" />

    {/* The apron: lane lines toward the seam, bollards, red strips doubled in a puddle. */}
    <path className="sa-line" d="M0 80 L62 66 M160 88 L104 66 M79 66 L79 90" />
    <path className="sa-dash" d="M79 68 V90" />
    {[[44, 72], [30, 76], [114, 72], [128, 76]].map(([x, y], i) => (
      <rect key={i} className="sa-metal" x={x} y={y - 3 - i * 0.2} width={1.2 + (i % 2) * 0.4} height={3 + (i % 2) * 0.8} />
    ))}
    <path className="sa-reflect" d="M48 72 V80 M110 72 V80 M54 72 H70" />
    <Air ids={ids} low={70} />
  </>
);

const TramSentinel = ({ ids }: { ids: Ids }) => (
  <>
    {/* The border wall along the horizon, its lamps lighting one after another. */}
    <path d="M0 62 V52 H20 V48 H44 V54 H70 V47 H96 V52 H124 V46 H160 V62 Z" fill={`url(#${ids.win})`} className="sa-far" />
    <path className="sa-edge" d="M0 44 H160 M0 46 H160" />
    {Array.from({ length: 12 }, (_, i) => (
      <circle key={i} className="sa-walllamp" cx={6 + i * 13} cy="43.4" r="0.3" style={{ ["--i" as string]: i }} />
    ))}
    {/* The tower: a lattice up to a lit cabin with a railing. */}
    <polygon points="106,58 114,58 111.6,18 108.4,18" fill={`url(#${ids.dots})`} />
    <path className="sa-line" d="M106.8 54 L113 50 L107.4 46 L112.4 42 L108 38 L112 34 L108.4 30 L111.6 26 L108.6 22" />
    <rect className="sa-metal" x="104.5" y="11.5" width="11" height="5.6" />
    <rect className="sa-booth-light" x="106" y="13" width="8" height="2.4" />
    <path className="sa-line" d="M103.4 17.2 H116.6 M103.4 17.2 V19 M116.6 17.2 V19 M110 11.5 V8" />
    <Glow x={110} y={14} r={9} fill={ids.red} className="sa-breathe" />
    <g className="sa-beam">
      <polygon className="sa-cone is-red" points="110,14 30,2 36,22" />
    </g>
    <g className="sa-beam is-other">
      <polygon className="sa-cone is-red" points="110,14 160,24 156,40" />
    </g>
    <circle className="sa-redlight" cx="110" cy="7.6" r="0.7" />
    {/* Patrol drones, smaller with distance. */}
    {[[70, 22], [82, 30], [128, 26], [140, 18]].map(([x, y], i) => (
      <g key={i} className="sa-patrol" style={{ ["--i" as string]: i }}>
        <Drone x={x} y={y} scale={0.1 + (i % 2) * 0.03} />
      </g>
    ))}
    <g transform="translate(0 8)">
      <path d={RAILING} fill={`url(#${ids.dots})`} />
      <path className="sa-edge" d={RAILING} />
      <path className="sa-line" d="M30 52 V44 M28 46 H32 M84 53 V46 M118 50 V40 M116 42 H120" />
      <rect className="sa-metal" x="60" y="53" width="6" height="4" />
    </g>
    <Air ids={ids} low={60} />
  </>
);

/*
 * Chapter 2: the Sentinel Ring between the city wall and the outer fence.
 * No one lives out here, so the warm light is gone; red is everything that
 * watches, teal only what Kai's side left behind. The one warm light left is
 * the command board at the charging station.
 */

type Pt = readonly [number, number];

/** A point at depth `t` (0 near, 1 at the vanishing point) on the line from the first point to the second. */
const along = ([x0, y0]: Pt, [x1, y1]: Pt, t: number): Pt => [x0 + (x1 - x0) * t, y0 + (y1 - y0) * t];

/** A wall seen in perspective: its top and foot edges, each from the near end to the far one. */
type Wall = { top: readonly [Pt, Pt]; foot: readonly [Pt, Pt] };

const DuongOng = ({ ids }: { ids: Ids }) => {
  // Looking down the drain: joint rings shrink toward the far opening at (80, 38).
  const rings = [66, 46, 33, 24, 18, 14];
  return (
    <>
      <rect x="0" y="0" width="160" height="90" fill={`url(#${ids.dim})`} />
      {/* The nearer wall is denser: a band of dots between the frame and the deep part of the pipe. */}
      <path d="M80 -62 A100 100 0 1 1 79.9 -62 Z M80 -2 A40 40 0 1 0 80.1 -2 Z" fill={`url(#${ids.dots})`} fillRule="evenodd" />
      {rings.map((r, i) => (
        <ellipse key={r} className="sa-edge" cx="80" cy="38" rx={r} ry={r * 0.94} style={{ strokeOpacity: 0.5 - i * 0.05 }} />
      ))}
      {/* Rust running down from two joints. */}
      <path className="sa-crack" d="M48 8 L47 14 L48.4 19 M118 12 L119 18 L117.6 22" />
      {/* The far mouth: night outside, the outer fence's posts against it. */}
      <circle cx="80" cy="38" r="10" className="sa-hole" />
      <path className="sa-line" d="M72 40 H88 M74 40 V35 M78 40 V34.6 M82 40 V34.6 M86 40 V35" style={{ strokeOpacity: 0.35 }} />
      {/* D-31, wedged nose-down against the wall, one eye still blinking. */}
      <Glow x={101} y={26} r={14} fill={ids.red} className="sa-breathe" />
      <g transform="rotate(28 101 26)">
        <Drone x={101} y={26} scale={0.72} />
      </g>
      {/* Standing water up to the joints' shoulders; the drone's light doubled in it. */}
      <polygon className="sa-water" points="-1,91 161,91 91.7,45.7 68.3,45.7" />
      <path className="sa-line" d="M60 66 H74 M88 72 H108 M70 52 H76 M84 56 H92" style={{ strokeOpacity: 0.25 }} />
      <path className="sa-reflect" d="M101 50 V62 M99.6 54 V58" />
      {/* A drop from the crown, a ring where it lands. */}
      <circle className="sa-drip" cx="66" cy="9" r="0.35" style={{ ["--drop" as string]: "49px" }} />
      <ellipse className="sa-splash" cx="66" cy="58" rx="2" ry="0.4" />
      <Air ids={ids} low={50} />
    </>
  );
};

const HangRaoNgoai = ({ ids }: { ids: Ids }) => {
  // The fence runs from the left edge to the vanishing point at (112, 40).
  const vp = [112, 40] as const;
  const top = (x: number) => 4 + 32 * (x / 112);
  const foot = (x: number) => 80 - 36 * (x / 112);
  const posts = [0, 30, 52, 68, 80, 89, 96, 101, 105];
  const mesh = posts
    .slice(0, -1)
    .map((x, i) => {
      const x2 = posts[i + 1];
      return `M${x} ${top(x)} L${x2} ${foot(x2)} M${x} ${foot(x)} L${x2} ${top(x2)}`;
    })
    .join(" ");
  const coils = Array.from({ length: 16 }, (_, i) => {
    const x = 105 * (1 - (1 - i / 15) ** 1.6);
    return [x, top(x) - 1 + (x / 112) * 0.7, 1 - (x / 112) * 0.7] as const;
  });
  return (
    <>
      {/* The city wall far behind, dark; the inner fence faint across the strip. */}
      <path d="M112 42 V34 H124 V30 H140 V35 H160 V42 Z" fill={`url(#${ids.win})`} className="sa-far" />
      <path className="sa-edge" d="M0 42 H160" />
      <path className="sa-line sa-far" d={`M160 20 L${vp[0]} 38 M160 64 L${vp[0]} 43 M150 24 V60 M138 28.6 V55.4 M128 32.4 V51.6 M121 35 V48.6`} style={{ strokeOpacity: 0.3 }} />
      {/* The outer fence: mesh panels between posts, wire coiled along its top. */}
      <polygon points={`0,${top(0)} 105,${top(105)} 105,${foot(105)} 0,${foot(0)}`} fill={`url(#${ids.dim})`} />
      <path className="sa-line" d={mesh} style={{ strokeOpacity: 0.4 }} />
      <path className="sa-line is-strong" d={posts.map((x) => `M${x} ${top(x) - 1} V${foot(x)}`).join(" ")} />
      <path className="sa-line" d={`M0 ${top(0)} L105 ${top(105)} M0 ${foot(0) - 8} L105 ${foot(105) - 0.8}`} />
      {coils.map(([x, y, r], i) => (
        <circle key={i} className="sa-wire" cx={x} cy={y} r={r} />
      ))}
      {/* Ruts the patrols wear along the foot of the fence. */}
      <path className="sa-dash" d={`M20 90 L${vp[0]} 44 M70 90 L${vp[0]} 44.6`} style={{ strokeOpacity: 0.25 }} />
      {/* The drone on its round, its light combing the fence. */}
      <g className="sa-alongfence">
        <g transform="translate(66 18)">
          <g className="sa-search">
            <polygon className="sa-cone is-red" points="-1.2,2 1.2,2 12,46 -10,46" />
          </g>
          <Glow x={0} y={0} r={8} fill={ids.red} className="sa-breathe" />
          <Drone x={0} y={0} scale={0.32} />
        </g>
      </g>
      <Air ids={ids} low={56} />
    </>
  );
};

const BaiContainer = ({ ids }: { ids: Ids }) => {
  // Two walls of containers, stacked two high, run to the vanishing point at (80, 40).
  const left: Wall = { top: [[0, 2], [68, 34]], foot: [[0, 78], [68, 46]] };
  const right: Wall = { top: [[160, 2], [92, 34]], foot: [[160, 78], [92, 46]] };
  const seams = [0, 0.38, 0.64, 0.82, 0.93];
  const wall = (w: Wall) => {
    const lines = seams.map((t, i) => {
      const [x, y0] = along(w.top[0], w.top[1], t);
      const [, y1] = along(w.foot[0], w.foot[1], t);
      // Ribs on each container: three per box, closer as they recede.
      const next = seams[i + 1] ?? 1;
      const ribs = [0.25, 0.5, 0.75].map((f) => {
        const [rx, ry0] = along(w.top[0], w.top[1], t + (next - t) * f);
        const [, ry1] = along(w.foot[0], w.foot[1], t + (next - t) * f);
        return `M${rx} ${ry0 + 1} V${ry1 - 1}`;
      });
      return { seam: `M${x} ${y0} V${y1}`, ribs: ribs.join(" ") };
    });
    return {
      shape: `${w.top[0].join(",")} ${w.top[1].join(",")} ${w.foot[1].join(",")} ${w.foot[0].join(",")}`,
      seams: lines.map((l) => l.seam).join(" "),
      ribs: lines.map((l) => l.ribs).join(" "),
    };
  };
  const l = wall(left);
  const r = wall(right);
  const clip = `${ids.dots}-walls`;
  return (
    <>
      <clipPath id={clip}>
        <polygon points={l.shape} />
        <polygon points={r.shape} />
      </clipPath>
      {/* The tower's mast past the end of the lane, its lamp on top. */}
      <path className="sa-line is-strong" d="M80 40 V24 M78.6 26 H81.4" />
      <Glow x={80} y={24} r={7} fill={ids.red} className="sa-breathe" />
      <circle className="sa-redlight" cx="80" cy="23.6" r="0.5" />
      {[l, r].map((w, i) => (
        <g key={i}>
          <polygon points={w.shape} fill={`url(#${ids.dots})`} />
          <polygon className="sa-edge" points={w.shape} />
          <path className="sa-line" d={w.ribs} style={{ strokeOpacity: 0.3 }} />
          <path className="sa-line is-strong" d={w.seams} />
          {/* The seam between the two tiers runs level: it sits at eye height. */}
          <path className="sa-line" d={i === 0 ? "M0 40 H68" : "M92 40 H160"} />
        </g>
      ))}
      {/* The floodlight's band sliding along the walls. */}
      <g clipPath={`url(#${clip})`}>
        <g className="sa-slide">
          <polygon className="sa-band" points="40,0 50,0 46,90 36,90" />
        </g>
      </g>
      {/* R-17's mark, cut by hand into a container long ago: the mast and its rings. */}
      <Glow x={40} y={31} r={4} fill={ids.teal} className="sa-breathe" />
      <g transform="translate(40 31) scale(0.55)">
        <path className="sa-mark" d="M-1.2 2 L0 -1.8 L1.2 2 M-0.7 0.6 H0.7 M-1.8 -2.4 A2.4 2.4 0 0 1 1.8 -2.4 M-2.8 -3.4 A3.8 3.8 0 0 1 2.8 -3.4" />
      </g>
      {/* The lane: ruts toward the far end, a puddle taking the lamp. */}
      <path className="sa-line" d="M38 90 L78 46 M122 90 L82 46" style={{ strokeOpacity: 0.3 }} />
      <path className="sa-reflect" d="M80 52 V60" />
      <Air ids={ids} low={58} />
    </>
  );
};

const ThapDenPha = ({ ids }: { ids: Ids }) => {
  const legs = "M70 66 L77 16 M90 66 L83 16";
  // Cross bracing up the lattice, narrowing with height.
  const brace = Array.from({ length: 7 }, (_, i) => {
    const y0 = 66 - i * 7;
    const y1 = y0 - 7;
    const half = (y: number) => 3 + ((y - 16) / 50) * 7;
    return `M${80 - half(y0)} ${y0} L${80 + half(y1)} ${y1} M${80 + half(y0)} ${y0} L${80 - half(y1)} ${y1}`;
  }).join(" ");
  return (
    <>
      {/* The ring's far wall and its fences along the horizon. */}
      <path d="M0 56 V50 H30 V47 H58 V51 H104 V46 H132 V50 H160 V56 Z" fill={`url(#${ids.win})`} className="sa-far" />
      <path className="sa-edge" d="M0 56 H160" />
      <path className="sa-line" d="M0 60 H160 M8 56 V60 M28 56 V60 M48 56 V60 M112 56 V60 M132 56 V60 M152 56 V60" style={{ strokeOpacity: 0.4 }} />
      {/* The tower: lattice legs, bracing, guy wires down to the ground. */}
      <polygon points="70,66 90,66 83,16 77,16" fill={`url(#${ids.dots})`} />
      <path className="sa-line is-strong" d={legs} />
      <path className="sa-line" d={brace} />
      <path className="sa-line" d="M78 22 L30 66 M82 22 L130 66" style={{ strokeOpacity: 0.4 }} />
      {/* The alarm ladder on its front: five steps, one lit. */}
      {[0, 1, 2, 3, 4].map((i) => (
        <rect key={i} className={i === 2 ? "sa-step is-lit" : "sa-step"} x="78.6" y={52 - i * 6} width="2.8" height="1.4" />
      ))}
      {/* The lamp house, and the beams that turn over the whole ring. */}
      <rect className="sa-metal" x="74" y="10" width="12" height="6" />
      <path className="sa-line" d="M73 16.4 H87 M73 16.4 V18 M87 16.4 V18 M80 10 V6.4" />
      <Glow x={80} y={12} r={14} fill={ids.red} className="sa-breathe" />
      <g className="sa-beam">
        <polygon className="sa-cone is-red" points="80,12 0,2 0,24" />
      </g>
      <g className="sa-beam is-other">
        <polygon className="sa-cone is-red" points="80,12 160,6 160,28" />
      </g>
      <rect className="sa-lamphead" x="76" y="11.4" width="8" height="2.4" />
      <circle className="sa-redlight" cx="80" cy="6" r="0.6" />
      <path className="sa-line" d="M60 90 L72 66 M100 90 L88 66" style={{ strokeOpacity: 0.3 }} />
      <Air ids={ids} low={58} />
    </>
  );
};

const NgaTuTuanTra = ({ ids }: { ids: Ids }) => (
  <>
    {/* Blocks at the far corners, long empty. */}
    <path d="M0 46 V32 H12 V26 H30 V34 H48 V30 H66 V38 H74 V46 Z" fill={`url(#${ids.win})`} className="sa-far" />
    <path d="M86 46 V36 H96 V28 H116 V33 H134 V24 H148 V31 H160 V46 Z" fill={`url(#${ids.win})`} className="sa-far" />
    {/* The patrol road coming at us and the one crossing it. */}
    <path className="sa-edge" d="M30 90 L68 52 L0 52 M130 90 L92 52 L160 52 M0 46 H74 L76 44 M160 46 H86 L84 44" style={{ strokeOpacity: 0.55 }} />
    <path className="sa-dash" d="M80 90 V53 M0 49 H70 M90 49 H160" />
    {/* Barriers on the corners. */}
    {[[58, 58, 1], [102, 58, -1], [20, 54, 1], [140, 54, -1]].map(([x, y, s], i) => (
      <path key={i} className="sa-metal" d={`M${x} ${y} h${4 * s} l${-0.8 * s} -2.4 h${-2.4 * s} Z`} />
    ))}
    <path className="sa-line" d="M24 52 V36 M136 52 V36 M22 36 H26 M134 36 H138" />
    <circle className="sa-redlight" cx="24" cy="35.4" r="0.4" style={{ ["--i" as string]: 1 }} />
    <circle className="sa-redlight" cx="136" cy="35.4" r="0.4" style={{ ["--i" as string]: 2 }} />
    {/* The guard drone, holding the middle of the crossing. */}
    <ellipse className="sa-shadow" cx="80" cy="49" rx="4" ry="0.6" />
    <g className="sa-hover">
      <Glow x={80} y={30} r={10} fill={ids.red} className="sa-breathe" />
      <Drone x={80} y={30} scale={0.42} />
    </g>
    {/* Now and then the tower's light passes over the crossing. */}
    <g className="sa-pass">
      <polygon className="sa-cone is-red" points="180,-20 36,62 70,70" />
    </g>
    <Air ids={ids} low={56} />
  </>
);

const TramSac = ({ ids }: { ids: Ids }) => {
  // Charging posts in a row toward the vanishing point at (84, 42); drones on some.
  const posts = [[14, 22, 6, 74], [38, 30, 4.2, 62], [54, 34, 3, 55], [65, 37, 2.2, 50], [72, 39, 1.6, 47]];
  const docked = [[0, 0.3], [1, 0.2], [3, 0.1]];
  return (
    <>
      {/* The canopy overhead, its beams closing toward the far end. */}
      <polygon points="0,0 160,0 160,6 98,30 70,30 0,8" fill={`url(#${ids.dim})`} />
      <path className="sa-edge" d="M0 8 L70 30 H98 L160 6 M24 0 L74 30 M60 0 L80 30 M100 0 L88 30 M136 0 L94 30" />
      <path className="sa-edge" d="M0 82 L76 46 H94 L160 80" />
      <path className="sa-line" d="M0 74 L76 46" style={{ strokeOpacity: 0.3 }} />
      {posts.map(([x, top, w, foot], i) => (
        <g key={i}>
          <rect x={x - w / 2} y={top} width={w} height={foot - top} fill={`url(#${ids.dots})`} />
          <rect className="sa-edge" x={x - w / 2} y={top} width={w} height={foot - top} />
          <rect className="sa-metal" x={x - w * 0.8} y={top - 0.6} width={w * 1.6} height={w * 0.2 + 0.3} />
          <circle className="sa-charge" cx={x} cy={top + (foot - top) * 0.3} r={w * 0.09} style={{ ["--i" as string]: i }} />
        </g>
      ))}
      <path className="sa-line" d={`${cable(14, 60, 38, 52, 4)} ${cable(38, 52, 54, 48, 2.6)} ${cable(54, 48, 65, 46, 1.6)}`} />
      {docked.map(([i, s]) => {
        const [x, top] = posts[i];
        return (
          <g key={i} className="sa-parked">
            <Drone x={x} y={top - 4.8 * s - 0.8} scale={s} />
          </g>
        );
      })}
      {/* The command board: the tower's orders scrolling for each docked drone. The only warm light out here. */}
      <Glow x={127} y={22} r={24} fill={ids.warm} className="sa-breathe" />
      <path className="sa-line is-strong" d="M112 34 V60 M142 34 V60" />
      <rect className="sa-boardface" x="106" y="10" width="42" height="24" />
      <rect className="sa-edge is-warm" x="106" y="10" width="42" height="24" />
      {[[18, 0], [12, 1], [24, 2], [16, 3], [20, 4], [10, 5]].map(([w, i]) => (
        <rect key={i} className={`sa-cmd${i === 2 ? " is-current" : ""}`} x="109" y={13 + i * 3.2} width={w} height="1.2" style={{ ["--i" as string]: i }} />
      ))}
      <path className="sa-edge is-warm" d="M134 13 V31" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <rect key={i} className="sa-cmd" x="137" y={13 + i * 3.2} width={4 + (i % 3) * 2} height="1.2" style={{ ["--i" as string]: i + 3 }} />
      ))}
      <Pool x={127} y={66} rx={20} ry={2.4} fill={ids.warm} className="sa-breathe" />
      <Air ids={ids} low={62} />
    </>
  );
};

const SCENE_ART: Partial<Record<Backdrop, (p: { ids: Ids }) => ReactNode>> = {
  "tang-ham": TangHam,
  "tram-r17": TramR17,
  "tram-khau-phan": TramKhauPhan,
  "ga-ngam": GaNgam,
  "cong-bac": CongBac,
  "vanh-dai-dien": VanhDaiDien,
  "tram-tham-van": TramThamVan,
  "cong-kiem-soat": CongKiemSoat,
  "tram-sentinel": TramSentinel,
  "duong-ong": DuongOng,
  "hang-rao-ngoai": HangRaoNgoai,
  "bai-container": BaiContainer,
  "thap-den-pha": ThapDenPha,
  "nga-tu-tuan-tra": NgaTuTuanTra,
  "tram-sac": TramSac,
};

/** Whether a backdrop is one of the drawn places (the rest are the city and the laptop). */
export const hasSceneArt = (id: Backdrop) => id in SCENE_ART;

export function SceneArt({ id }: { id: Backdrop }) {
  const uid = useId().replace(/:/g, "");
  const ids: Ids = {
    dots: `${uid}-dots`,
    dim: `${uid}-dim`,
    win: `${uid}-win`,
    tile: `${uid}-tile`,
    hatch: `${uid}-hatch`,
    fog: `${uid}-fog`,
    teal: `${uid}-teal`,
    warm: `${uid}-warm`,
    red: `${uid}-red`,
    vignette: `${uid}-vig`,
  };
  const Art = SCENE_ART[id];
  if (!Art) return null;
  return (
    <svg className={`sa sa-${id}`} viewBox="0 0 160 90" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      <Defs ids={ids} />
      <g className="sa-haunt">
        <Art ids={ids} />
      </g>
    </svg>
  );
}
