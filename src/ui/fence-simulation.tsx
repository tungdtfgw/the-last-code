import { useMemo } from "react";
import type { Cue } from "../audio/sound-recipes";
import type { RunOutcome } from "../game/classify-run";
import type { LevelDefinition } from "../game/level-types";
import {
  MAX_CELLS,
  buildFenceTimeline,
  idleFenceScene,
  runningFenceScene,
  summarizeFence,
  type FenceCell,
  type FenceScene,
} from "./fence-timeline";
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

// Layout in viewBox units (labels ≥ 16 units, except the small caps headings). Fence and rack end
// left of x = 250 so the meter's value and mark labels never cross them.
const W = 420;
const H = 400;
const FENCE = { x: 16, y: 44, w: 220, h: 96 };
const RACK = { x: 16, y: 186, perRow: MAX_CELLS / 2, cellW: 22, cellH: 36, gap: 6 };
const ODD = { x: 16, y: 292 };
const METER = { x: 344, top: 44, zero: 286, bottom: 326, w: 30 };

/** Height of a value on the meter: zero at `METER.zero`, the mark at 80% of the positive range. */
function meterY(value: number, need: number): number {
  const max = Math.max(1, need) / 0.8;
  const clamped = Math.min(value, max);
  return METER.zero - (clamped / max) * (METER.zero - METER.top);
}

function Cell({ cell, x, y }: { cell: FenceCell; x: number; y: number }) {
  const { cellW: w, cellH: h } = RACK;
  return (
    <g className={`fence-cell is-${cell.state}`} style={{ color: toneVar(cell.tone) }}>
      <rect x={x + w / 2 - 4} y={y - 4} width={8} height={4} className="fence-cell-cap" />
      <rect x={x} y={y} width={w} height={h} className="fence-cell-body" />
      {cell.state === "cut" && <path d={`M${x - 3} ${y + h * 0.62} L${x + w + 3} ${y + h * 0.38}`} className="fence-cut" />}
    </g>
  );
}

function Posts({ scene }: { scene: FenceScene }) {
  const n = scene.posts;
  const step = n > 1 ? FENCE.w / (n - 1) : 0;
  const xs = Array.from({ length: n }, (_, i) => FENCE.x + (n > 1 ? i * step : FENCE.w / 2));
  // Half: the left half of the posts goes dark; off: all of them.
  const dark = (i: number) => scene.fence === "off" || (scene.fence === "half" && i < Math.ceil(n / 2));
  return (
    <g className={`fence-posts is-${scene.fence}`}>
      {[0.3, 0.55, 0.8].map((f) =>
        xs.slice(1).map((x, i) => (
          <line
            key={`w-${f}-${i}`}
            x1={xs[i]}
            x2={x}
            y1={FENCE.y + FENCE.h * f}
            y2={FENCE.y + FENCE.h * f}
            className={`fence-wire${dark(i) && dark(i + 1) ? " is-dark" : ""}`}
          />
        )),
      )}
      {xs.map((x, i) => (
        <rect key={`p-${i}`} x={x - 4} y={FENCE.y} width={8} height={FENCE.h} className={`fence-post${dark(i) ? " is-dark" : ""}`} />
      ))}
      {scene.fence === "discharge" &&
        xs.map((x, i) => (
          <path
            key={`s-${i}`}
            d={`M${x} ${FENCE.y - 6} l-6 12 l9 4 l-7 14 l10 -2`}
            className="fence-spark"
            style={{ animationDelay: `${(i % 3) * 80}ms` }}
          />
        ))}
    </g>
  );
}

function Meter({ scene }: { scene: FenceScene }) {
  const { value, need, state } = scene.meter;
  const markY = meterY(need, need);
  const negative = value !== null && value < 0;
  const fillTop = value === null || negative ? METER.zero : meterY(value, need);
  return (
    <g className={`fence-meter is-${state}`}>
      <text x={METER.x + METER.w / 2} y={METER.top - 14} textAnchor="middle" className="sim-label">
        ĐỒNG HỒ
      </text>
      <rect x={METER.x} y={METER.top} width={METER.w} height={METER.bottom - METER.top} className="fence-meter-frame" />
      <rect x={METER.x} y={METER.zero} width={METER.w} height={METER.bottom - METER.zero} className="fence-meter-below" />
      {value !== null && !negative && (
        <rect x={METER.x + 3} y={fillTop} width={METER.w - 6} height={METER.zero - fillTop} className="fence-meter-fill" />
      )}
      {negative && <rect x={METER.x + 3} y={METER.zero} width={METER.w - 6} height={METER.bottom - METER.zero - 3} className="fence-meter-negative" />}
      <line x1={METER.x - 10} x2={METER.x + METER.w + 4} y1={METER.zero} y2={METER.zero} className="fence-meter-zero" />
      <line x1={METER.x - 10} x2={METER.x + METER.w + 4} y1={markY} y2={markY} className="fence-meter-mark" />
      <text x={METER.x - 14} y={markY + 5} textAnchor="end" className="fence-meter-need">
        {`CẦN ${need}`}
      </text>
      {value !== null && (
        <text x={METER.x - 14} y={(negative ? METER.bottom : fillTop) + 5} textAnchor="end" className="fence-meter-value">
          {String(value)}
        </text>
      )}
    </g>
  );
}

function Scene({ scene }: { scene: FenceScene }) {
  const odd = scene.partial;
  const oddH = RACK.cellH;
  return (
    <svg className="sim-svg fence-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" role="img" aria-label="Mô phỏng Vành Đai Điện">
      <text x={FENCE.x} y={24} className="sim-label">
        {`RÀO · ${scene.posts} ĐOẠN`}
      </text>
      <g className={`sentinel${scene.sentinel ? " is-on" : ""}`} aria-hidden="true">
        <circle cx={W - 14} cy={20} r={6} className="sentinel-lamp" />
        <text x={W - 26} y={24} className="sim-label" textAnchor="end">
          SENTINEL
        </text>
      </g>
      <Posts scene={scene} />

      <text x={RACK.x} y={RACK.y - 18} className="sim-label">
        {scene.capacity === null ? "GIÁ PIN" : `GIÁ PIN · 1 PIN = ${scene.capacity}`}
      </text>
      {Array.from({ length: MAX_CELLS }, (_, k) => {
        const x = RACK.x + (k % RACK.perRow) * (RACK.cellW + RACK.gap);
        const y = RACK.y + Math.floor(k / RACK.perRow) * (RACK.cellH + 14);
        const cell = scene.cells[k];
        return cell ? <Cell key={`c-${k}`} cell={cell} x={x} y={y} /> : <rect key={`c-${k}`} x={x} y={y} width={RACK.cellW} height={RACK.cellH} className="fence-dock" />;
      })}
      {scene.moreCells > 0 && (
        <text x={RACK.x + RACK.perRow * (RACK.cellW + RACK.gap) + 4} y={RACK.y + 24} className="fence-more">
          {`+${scene.moreCells}`}
        </text>
      )}

      <text x={ODD.x} y={ODD.y - 8} className="sim-label">
        PIN LẺ
      </text>
      <rect x={ODD.x} y={ODD.y} width={RACK.cellW} height={oddH} className="fence-dock" />
      {odd && (
        <g className={`fence-cell is-${odd.state}`} style={{ color: toneVar(odd.tone) }}>
          <rect x={ODD.x} y={ODD.y + oddH * (1 - odd.fill)} width={RACK.cellW} height={oddH * odd.fill} className="fence-cell-body" />
          {odd.state === "cut" && <path d={`M${ODD.x - 3} ${ODD.y + oddH * 0.62} L${ODD.x + RACK.cellW + 3} ${ODD.y + oddH * 0.38}`} className="fence-cut" />}
        </g>
      )}
      {scene.rackLabel && (
        <text x={ODD.x + RACK.cellW + 16} y={ODD.y + 24} className="fence-verdict tone-alarm">
          {scene.rackLabel}
        </text>
      )}

      <Meter scene={scene} />
      {scene.meter.label && (
        <text x={FENCE.x} y={H - 18} className={`fence-verdict ${scene.meter.state === "exact" ? "tone-ok" : "tone-alarm"}`}>
          {scene.meter.label}
        </text>
      )}
    </svg>
  );
}

/** Vành Đai Điện (level 1.5): the computed energy on a meter, the cells on a rack, the fence going dark. */
export function FenceSimulation({ level, outcome, running, playing, onDone, onCue }: Props) {
  const frames = useMemo(() => (outcome ? buildFenceTimeline(outcome, level) : []), [outcome, level]);
  const { frame, skip, reduced } = useTimelinePlayback(frames, { playing, onDone, onCue });
  const scene = running ? runningFenceScene(level) : (frame?.scene ?? idleFenceScene(level));
  const summary = !running && !playing && frames.length ? summarizeFence(frames) : "";

  return (
    <div data-testid="fence" className={`sim fence${scene.shake && !reduced ? " is-shaking" : ""}${scene.wave === "counter" ? " is-counter" : ""}`}>
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
        <p className="sim-chip">{`> ${scene.chip}`}</p>
        <p className={`sim-status scanner-${scene.signal}`}>{scene.status}</p>
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
