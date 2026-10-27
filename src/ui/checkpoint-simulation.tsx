import { useMemo } from "react";
import type { Cue } from "../audio/sound-recipes";
import type { RunOutcome } from "../game/classify-run";
import { outputObjectives, type LevelDefinition } from "../game/level-types";
import {
  buildCheckpointTimeline,
  checkpointIdleScene,
  checkpointRunningScene,
  summarizeCheckpoint,
  type CheckpointScene,
} from "./checkpoint-timeline";
import { OutputSlots } from "./output-slots";
import { useTimelinePlayback } from "./use-timeline-playback";

interface Props {
  level: LevelDefinition;
  outcome: RunOutcome | null;
  running: boolean;
  playing: boolean;
  onDone(): void;
  onCue(cue: Cue, delayMs?: number): void;
}

const VIEW_W = 420;
const VIEW_H = 250;
const GATE_X = 160;
const BASE_Y = 226;
const RING_R = [104, 84, 64];
const BOOTH = { x: 318, y: 116, w: 88, h: 110 };

const RING_TEXT: Record<string, string> = { locked: "ĐẠT", rejected: "BÁC", notReached: "CHƯA TỚI", scanning: "ĐANG QUÉT", idle: "" };

/** Arch of radius r standing on the floor line. */
const arch = (r: number) => `M${GATE_X - r} ${BASE_Y} V${BASE_Y - 70} A ${r} ${r} 0 0 1 ${GATE_X + r} ${BASE_Y - 70} V${BASE_Y}`;

function Scene({ scene, place }: { scene: CheckpointScene; place: string }) {
  const inner = RING_R[RING_R.length - 1] - 8;
  return (
    <svg className="sim-svg checkpoint-svg" viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} preserveAspectRatio="xMidYMid meet" role="img" aria-label={`Mô phỏng ${place}`}>
      <path className="checkpoint-floor" d={`M8 ${BASE_Y} H${VIEW_W - 8}`} aria-hidden="true" />

      {/* scan rings: round 1 outermost */}
      {scene.rings.map((ring, i) => {
        const r = RING_R[i] ?? Math.max(24, RING_R[RING_R.length - 1] - (i - RING_R.length + 1) * 16);
        return (
          <g key={i} className={`checkpoint-ring is-${ring}`} aria-hidden="true">
            <path d={arch(r)} />
            {RING_TEXT[ring] && (
              <text x={GATE_X} y={BASE_Y - 70 - r + 13} textAnchor="middle" className="checkpoint-ring-text">
                {`${i + 1} · ${RING_TEXT[ring]}`}
              </text>
            )}
          </g>
        );
      })}

      {/* gate leaves: closed, half or fully open */}
      <g className={`checkpoint-gate is-${scene.gate}`} aria-hidden="true">
        <rect className="checkpoint-leaf is-left" x={GATE_X - inner} y={BASE_Y - 92} width={inner} height={92} />
        <rect className="checkpoint-leaf is-right" x={GATE_X} y={BASE_Y - 92} width={inner} height={92} />
      </g>
      {scene.label && (
        <text x={GATE_X} y={BASE_Y - 40} textAnchor="middle" className={`checkpoint-label${scene.gate === "closed" ? " is-alarm" : ""}`}>
          {scene.label}
        </text>
      )}
      {scene.compileError && (
        <text x={GATE_X} y={BASE_Y - 40} textAnchor="middle" className="checkpoint-label is-alarm">
          TỪ CHỐI
        </text>
      )}

      {/* guard booth: dark until the hand check, then the light comes on and the figure stands */}
      <g className={`checkpoint-booth is-${scene.booth}`} aria-hidden="true">
        <rect className="checkpoint-booth-body" x={BOOTH.x} y={BOOTH.y} width={BOOTH.w} height={BOOTH.h} />
        <rect className="checkpoint-booth-glass" x={BOOTH.x + 10} y={BOOTH.y + 14} width={BOOTH.w - 20} height={54} />
        <g className="checkpoint-figure">
          <circle cx={BOOTH.x + BOOTH.w / 2} cy={BOOTH.y + 40} r={8} />
          <path d={`M${BOOTH.x + BOOTH.w / 2 - 16} ${BOOTH.y + 68} Q ${BOOTH.x + BOOTH.w / 2} ${BOOTH.y + 44} ${BOOTH.x + BOOTH.w / 2 + 16} ${BOOTH.y + 68} Z`} />
        </g>
        <text x={BOOTH.x + BOOTH.w / 2} y={BOOTH.y + BOOTH.h - 12} textAnchor="middle" className="sim-label">
          NX-0417
        </text>
      </g>

      <g className={`sentinel${scene.sentinel ? " is-on" : ""}`} aria-hidden="true">
        <circle cx={VIEW_W - 16} cy={18} r={7} className="sentinel-lamp" />
        <text x={VIEW_W - 30} y={22} className="sim-label" textAnchor="end">
          SENTINEL
        </text>
      </g>
    </svg>
  );
}

/** Component name of an output objective: the label up to its colon. */
const cellName = (label: string) => label.split(":")[0].trim();

/** The fake Neural-ID under the gate, one cell per output line. */
function IdBar({ scene, names }: { scene: CheckpointScene; names: string[] }) {
  const lit = scene.idBar.filter((c) => c === "lit" || c === "white").length;
  return (
    <div className="checkpoint-id" role="img" aria-label={`Neural-ID giả: ${lit}/${scene.idBar.length} thành phần qua cổng`}>
      {scene.idBar.map((cell, i) => (
        <span key={i} className={`checkpoint-id-cell is-${cell}${scene.active === i ? " is-active" : ""}`}>
          <span className="checkpoint-id-n">{i + 1}</span>
          <span className="checkpoint-id-name">{names[i] ?? "—"}</span>
        </span>
      ))}
    </div>
  );
}

/** Checkpoint gate (Boss 1.7): three scan rounds in a row, then the night guard's hand check. Plays a pure timeline back. */
export function CheckpointSimulation({ level, outcome, running, playing, onDone, onCue }: Props) {
  const frames = useMemo(() => (outcome ? buildCheckpointTimeline(outcome, level) : []), [outcome, level]);
  const { frame, skip, reduced } = useTimelinePlayback(frames, { playing, onDone, onCue });
  const scene = running ? checkpointRunningScene(level) : (frame?.scene ?? checkpointIdleScene(level));
  const summary = !running && !playing && frames.length ? summarizeCheckpoint(frames) : "";
  const names = useMemo(() => outputObjectives(level).map((o) => cellName(o.label)), [level]);
  const alarm = scene.gate === "closed" && (scene.label !== null || scene.compileError || scene.sentinel) || scene.label === "KIỂM TAY BÁC" || scene.slots.some((s) => s.state === "error");

  return (
    <div className={`sim checkpoint${scene.wave === "counter" ? " is-counter" : ""}`}>
      {scene.banner && (
        <div className="sim-banner" role="status">
          <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
            <path d="M8 1.5 L15 14.5 H1 Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 6v4M8 11.6v.8" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          {scene.banner}
        </div>
      )}
      <div className="checkpoint-stage">
        <Scene scene={scene} place={level.location ?? "Cổng Kiểm Soát"} />
      </div>
      <IdBar scene={scene} names={names} />
      <OutputSlots slots={scene.slots} extra={scene.extra} wave={`${scene.wave}-${scene.round ?? 0}`} label="Sáu dòng tín hiệu" />
      <div className="sim-foot">
        <p className="sim-chip">
          {scene.round !== null && <span className="checkpoint-round">{`VÒNG ${scene.round}/${scene.rings.length} `}</span>}
          {scene.chip ? `> ${scene.chip}` : ""}
          {scene.stdinChip && <span className="checkpoint-stdin">{` · ${scene.stdinChip}`}</span>}
        </p>
        <p className={`sim-status ${scene.gate === "open" ? "scanner-pass" : alarm ? "scanner-alarm" : scene.status === "ĐANG QUÉT" ? "scanner-scanning" : ""}`}>
          {scene.status}
        </p>
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
