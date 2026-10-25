import { useMemo } from "react";
import type { Cue } from "../audio/sound-recipes";
import type { RunOutcome } from "../game/classify-run";
import type { LevelDefinition } from "../game/level-types";
import {
  LANES,
  buildSorterTimeline,
  idleSorterScene,
  runningSorterScene,
  summarizeSorter,
  type Parcel,
  type SorterScene,
} from "./sorter-timeline";
import { toneVar } from "./type-colors";
import { useTimelinePlayback } from "./use-timeline-playback";

interface Props {
  level: LevelDefinition;
  outcome: RunOutcome | null;
  running: boolean;
  playing: boolean;
  onDone(): void;
  onCue(cue: Cue, delayMs?: number): void;
}

// Layout in viewBox units (GDD 1.3 §5: 420 × 470, labels ≥ 16 units).
const W = 420;
const H = 470;
const TOP = 84;
const BELT_X = 12;
const BELT_W = 116;
const ROW = 50;
const SCAN_X = 132;
const LANE_X = 150;
const LANE_R = 392;
const LANE_H = 62;
const BOTTOM = TOP + LANE_H * 4;
const SLOT_X = 296;
const SLOT_W = 94;
const BIN_Y = 344;
const BIN_ROW = 18;
const MOULD = { x: 266, y: 32, r: 17 };
const TOKEN_W = 60;
const TOKEN_H = 24;

const clip = (text: string, max: number) => (text.length > max ? text.slice(0, Math.max(1, max - 1)) + "…" : text);
const laneTop = (lane: number) => TOP + lane * LANE_H;
const hexagon = (r: number) =>
  Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i;
    return `${(r * Math.cos(a)).toFixed(1)},${(r * Math.sin(a)).toFixed(1)}`;
  }).join(" ");

/** Rejected or missing parcels, listed in the bin in objective order. */
const binList = (scene: SorterScene) => scene.parcels.filter((p) => p.stage === "bin" || p.stage === "empty");

function tokenPlace(p: Parcel, i: number, scene: SorterScene): { x: number; y: number; scale: number } {
  switch (p.stage) {
    case "lane":
      return { x: 244, y: laneTop(LANES.indexOf(p.lane!)) + 37, scale: 1 };
    case "slot":
      return p.lane ? { x: SLOT_X + SLOT_W / 2, y: laneTop(LANES.indexOf(p.lane)) + 37, scale: 1 } : { x: 244, y: BIN_Y, scale: 1 };
    case "bin":
      return { x: 30, y: BIN_Y + 20 + binList(scene).indexOf(p) * BIN_ROW - 5, scale: 0.5 };
    case "stamp":
      return { x: MOULD.x, y: MOULD.y, scale: 1 };
    default:
      return { x: BELT_X + 4 + TOKEN_W / 2, y: TOP + i * ROW + 34, scale: 1 };
  }
}

function Token({ parcel, i, scene }: { parcel: Parcel; i: number; scene: SorterScene }) {
  if (parcel.stage === "empty") return null;
  const { x, y, scale } = tokenPlace(parcel, i, scene);
  const graded = parcel.stage !== "belt";
  const cls = `sorter-token is-${parcel.stage}${parcel.ok ? " is-ok" : graded ? " is-bad" : ""}`;
  return (
    <g className={cls} style={{ transform: `translate(${x}px, ${y}px) scale(${scale})`, color: toneVar(graded ? parcel.tone : "other") }}>
      <title>{`${parcel.name}${parcel.preview ? ` = ${parcel.preview}` : ""}${parcel.verdict ? ` · ${parcel.verdict}` : ""}`}</title>
      {parcel.kind === "stamp" ? (
        <polygon points={hexagon(MOULD.r)} className="sorter-stamp" />
      ) : (
        <rect x={-TOKEN_W / 2} y={-TOKEN_H / 2} width={TOKEN_W} height={TOKEN_H} className="sorter-parcel" />
      )}
      {graded && (
        <text className="sorter-token-type" y={5} textAnchor="middle">
          {clip(parcel.typeLabel, parcel.kind === "stamp" ? 4 : 6)}
        </text>
      )}
    </g>
  );
}

function Scene({ scene }: { scene: SorterScene }) {
  const stamp = scene.parcels.find((p) => p.stage === "stamp");
  const bin = binList(scene);
  return (
    <svg className="sim-svg sorter-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" role="img" aria-label="Mô phỏng máy phân loại bốn làn">
      <defs>
        <pattern id="sorter-hazard" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="5" height="12" fill="var(--alarm)" opacity="0.22" />
        </pattern>
      </defs>

      {/* session card + mould slot */}
      {scene.session && (
        <g className="sorter-session" style={{ color: toneVar(scene.session.tone) }}>
          <rect x={BELT_X} y={14} width={178} height={36} />
          <text x={BELT_X + 10} y={38}>
            {clip(scene.session.label, 17)}
          </text>
        </g>
      )}
      <text x={198} y={37} className="sim-label">
        KHUÔN
      </text>
      <polygon points={hexagon(MOULD.r + 3)} transform={`translate(${MOULD.x} ${MOULD.y})`} className="sorter-mould" />
      {stamp && (
        <text x={MOULD.x + 24} y={38} className={`sorter-verdict ${stamp.ok ? "tone-ok" : "tone-alarm"}`}>
          {stamp.verdict}
        </text>
      )}

      <text x={BELT_X} y={TOP - 12} className="sim-label">
        BĂNG CHUYỀN
      </text>
      <g className={`sentinel${scene.sentinel ? " is-on" : ""}`} aria-hidden="true">
        <circle cx={W - 14} cy={TOP - 16} r={6} className="sentinel-lamp" />
        <text x={W - 26} y={TOP - 12} className="sim-label" textAnchor="end">
          SENTINEL
        </text>
      </g>

      <rect x={BELT_X} y={TOP - 4} width={BELT_W} height={BOTTOM - TOP + 4} className="sorter-belt" />
      {/* belt rows: the name stays; the outline turns dashed once the parcel has left */}
      {scene.parcels.map((p, i) => (
        <g key={`row-${p.name}`} className={`sorter-row${p.stage === "belt" ? " is-waiting" : " is-gone"}`}>
          <text x={BELT_X + 4} y={TOP + i * ROW + 16} className="sorter-name">
            {clip(p.name, 11)}
          </text>
          <rect x={BELT_X + 4} y={TOP + i * ROW + 22} width={TOKEN_W} height={TOKEN_H} className="sorter-dock" />
        </g>
      ))}

      {/* scanner */}
      <g className={`scanner scanner-${scene.scanner}`} aria-hidden="true">
        <rect x={SCAN_X} y={TOP} width={12} height={BOTTOM - TOP} className="scanner-frame" />
        {scene.scanner === "alarm" && <rect x={SCAN_X} y={TOP} width={12} height={BOTTOM - TOP} fill="url(#sorter-hazard)" />}
      </g>

      {/* four lanes, always all four; slots named after the variables each one expects */}
      {LANES.map((lane, k) => {
        const top = laneTop(k);
        const wanted = scene.slots[lane];
        const inSlot = scene.parcels.find((p) => p.stage === "slot" && p.lane === lane);
        return (
          <g key={lane} className="sorter-lane" style={{ color: toneVar(lane) }}>
            <rect x={LANE_X} y={top + 4} width={LANE_R - LANE_X} height={LANE_H - 8} className="sorter-lane-track" />
            <rect x={LANE_X} y={top + 4} width={4} height={LANE_H - 8} className="sorter-lane-mark" />
            <text x={LANE_X + 12} y={top + 42} className="sorter-lane-name">
              {lane}
            </text>
            {wanted.length > 0 && (
              <>
                <text x={SLOT_X + SLOT_W} y={top + 18} textAnchor="end" className="sorter-slot-name">
                  {clip(wanted.join(", "), 9)}
                </text>
                <rect x={SLOT_X} y={top + 22} width={SLOT_W} height={30} className="sorter-slot" />
              </>
            )}
            {inSlot && (
              <text x={SLOT_X - 6} y={top + 43} textAnchor="end" className={`sorter-verdict ${inSlot.ok ? "tone-ok" : "tone-alarm"}`}>
                {inSlot.verdict}
              </text>
            )}
          </g>
        );
      })}

      {/* platform barrier: closed, half (1–2 stars), open (3 stars) */}
      <g className={`sorter-gate is-${scene.gate}`} aria-hidden="true">
        <rect x={LANE_R + 6} y={TOP} width={14} height={BOTTOM - TOP} className="sorter-gate-frame" />
        <rect x={LANE_R + 8} y={TOP + 2} width={10} height={BOTTOM - TOP - 4} className="sorter-gate-leaf" />
      </g>

      {/* hold bin */}
      <rect x={BELT_X} y={BIN_Y} width={W - 2 * BELT_X} height={108} className="sorter-bin" />
      <rect x={BELT_X} y={BIN_Y} width={W - 2 * BELT_X} height={108} fill="url(#sorter-hazard)" className="sorter-bin-stripes" />
      {bin.map((p, k) => (
        <text key={`bin-${p.name}`} x={BELT_X + 40} y={BIN_Y + 20 + k * BIN_ROW} className={`sorter-bin-line${p.stage === "empty" ? " tone-muted" : ""}`}>
          {clip(`${p.name} · ${p.verdict ?? ""}`, 36)}
        </text>
      ))}
      <text x={BELT_X} y={H - 6} className="sim-label">
        THÙNG GIỮ LẠI
      </text>

      {scene.parcels.map((p, i) => (
        <Token key={`${scene.wave}-${p.name}`} parcel={p} i={i} scene={scene} />
      ))}
    </svg>
  );
}

/** Four-lane shape sorter (level 1.3): plays the graded shapes back after the run. */
export function SorterSimulation({ level, outcome, running, playing, onDone, onCue }: Props) {
  const frames = useMemo(() => (outcome ? buildSorterTimeline(outcome, level) : []), [outcome, level]);
  const { frame, skip, reduced } = useTimelinePlayback(frames, { playing, onDone, onCue });
  const scene = running ? runningSorterScene(level) : (frame?.scene ?? idleSorterScene(level));
  const summary = !running && !playing && frames.length ? summarizeSorter(frames) : "";

  return (
    <div data-testid="sorter" className={`sim sorter${scene.shake && !reduced ? " is-shaking" : ""}${scene.wave === "counter" ? " is-counter" : ""}`}>
      {scene.banner && (
        <div className="sim-banner" role="status">
          <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
            <path d="M8 1.5 L15 14.5 H1 Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 6v4M8 11.6v.8" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          {scene.banner}
        </div>
      )}
      <Scene scene={scene} />
      <div className="sim-foot">
        <p className={`sim-status scanner-${scene.scanner}`}>{scene.status}</p>
        {playing && !reduced && (
          <button type="button" className="btn btn-ghost btn-small" onClick={skip}>
            Bỏ qua hoạt cảnh <kbd>Esc</kbd>
          </button>
        )}
      </div>
      <p className="sr-only" aria-live="polite">
        {summary}
      </p>
    </div>
  );
}
