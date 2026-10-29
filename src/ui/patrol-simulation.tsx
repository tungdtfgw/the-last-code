import { useMemo } from "react";
import type { Cue } from "../audio/sound-recipes";
import type { RunOutcome } from "../game/classify-run";
import type { LevelDefinition } from "../game/level-types";
import { OutputSlots } from "./output-slots";
import {
  buildPatrolTimeline,
  patrolIdleScene,
  patrolRunningScene,
  summarizePatrol,
  type PatrolScene,
  type SituationState,
} from "./patrol-timeline";
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
const VIEW_H = 220;
/** The two fence lines: the city side (bottom) and the outer fence (top). */
const FENCE_TOP = 34;
const FENCE_BOTTOM = 186;
const DRONE = { x: 210, y: 70 };
/** Kai's dot: waiting below the strip, across it, or stopped in the middle. */
const KAI_AT = { waiting: { x: 210, y: 204 }, through: { x: 210, y: 18 }, caught: { x: 210, y: 132 }, still: { x: 210, y: 132 } };

const SITUATION_TEXT: Record<SituationState, string> = {
  idle: "",
  active: "ĐANG XÉT",
  passed: "QUA",
  caught: "BỊ PHÁT HIỆN",
  notReached: "CHƯA TỚI",
};

function Strip({ scene, place }: { scene: PatrolScene; place: string }) {
  const kai = KAI_AT[scene.kai];
  const locked = scene.drone === "locked";
  return (
    <svg className="sim-svg patrol-svg" viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} preserveAspectRatio="xMidYMid meet" role="img" aria-label={`Mô phỏng ${place}`}>
      <g className="patrol-fence" aria-hidden="true">
        <path d={`M8 ${FENCE_TOP} H${VIEW_W - 8}`} />
        <path d={`M8 ${FENCE_BOTTOM} H${VIEW_W - 8}`} />
        <text x={12} y={FENCE_TOP - 8} className="sim-label">RÀO NGOÀI</text>
        <text x={12} y={FENCE_BOTTOM + 18} className="sim-label">TƯỜNG THÀNH PHỐ</text>
      </g>

      {/* The drone's light: sweeping while it watches, locked on Kai when it catches him. */}
      <g className={`patrol-drone is-${scene.drone}`} aria-hidden="true">
        {scene.drone !== "idle" && (
          <polygon
            className="patrol-beam"
            points={locked ? `${DRONE.x},${DRONE.y} ${kai.x - 26},${kai.y + 14} ${kai.x + 26},${kai.y + 14}` : `${DRONE.x},${DRONE.y} ${DRONE.x - 46},${FENCE_BOTTOM - 4} ${DRONE.x + 46},${FENCE_BOTTOM - 4}`}
          />
        )}
        <g className="patrol-drone-body">
          <rect x={DRONE.x - 16} y={DRONE.y - 7} width={32} height={10} rx={2} />
          <path d={`M${DRONE.x - 26} ${DRONE.y - 10} H${DRONE.x - 12} M${DRONE.x + 12} ${DRONE.y - 10} H${DRONE.x + 26}`} />
          <circle className="patrol-drone-eye" cx={DRONE.x} cy={DRONE.y + 1} r={3} />
        </g>
      </g>

      <g className={`patrol-kai is-${scene.kai}`} style={{ transform: `translate(${kai.x}px, ${kai.y}px)` }} aria-hidden="true">
        <circle r={7} />
        {locked && <circle className="patrol-kai-ring" r={13} />}
      </g>

      {(scene.label || scene.compileError) && (
        <text x={VIEW_W / 2} y={FENCE_BOTTOM - 14} textAnchor="middle" className={`patrol-label${locked || scene.compileError ? " is-alarm" : scene.drone === "passed" ? " is-pass" : ""}`}>
          {scene.label ?? "TỪ CHỐI"}
        </text>
      )}

      <g className={`sentinel${scene.sentinel ? " is-on" : ""}`} aria-hidden="true">
        <circle cx={VIEW_W - 16} cy={FENCE_TOP + 16} r={7} className="sentinel-lamp" />
        <text x={VIEW_W - 30} y={FENCE_TOP + 20} className="sim-label" textAnchor="end">
          SENTINEL
        </text>
      </g>
    </svg>
  );
}

/** The sensor board of the situation on screen: input chips and stdin lines (an empty line is a labelled empty card);
 * once Kai has moved, each stdin line says whether the program read it. */
function Sensors({ scene }: { scene: PatrolScene }) {
  if (scene.sensors.length === 0) return null;
  return (
    <ul className="patrol-sensors" aria-label="Bảng cảm biến">
      {scene.sensors.map((c, i) => (
        <li
          key={`${c.kind}-${i}`}
          className={`patrol-sensor is-${c.kind}${c.empty ? " is-empty" : ""}${c.read === undefined ? "" : c.read ? " is-read" : " is-unread"}`}
        >
          <span className="patrol-sensor-name">{c.name}</span>
          <span className="patrol-sensor-value">{c.text}</span>
          {c.read !== undefined && <span className="patrol-sensor-state">{c.read ? "ĐÃ ĐỌC" : "CHƯA ĐỌC"}</span>}
        </li>
      ))}
    </ul>
  );
}

/** Right or wrong in a shape and words, not only in colour. */
function Mark({ state }: { state: "idle" | "ok" | "bad" }) {
  if (state === "idle") return null;
  return (
    <>
      <span className="patrol-mark" aria-hidden="true">
        {state === "ok" ? "✓" : "✗"}
      </span>
      <span className="sr-only">{state === "ok" ? "đúng" : "sai"}</span>
    </>
  );
}

/** Kai's move (the `decision` objective) and the other objectives as drone lamps. */
function Readout({ scene }: { scene: PatrolScene }) {
  if (!scene.decision && scene.lamps.length === 0) return null;
  return (
    <div className="patrol-readout">
      {scene.decision && (
        <p className={`patrol-chip is-${scene.decision.state}`}>
          <span className="patrol-chip-name">{scene.decision.label}</span>
          <span className="patrol-chip-value">{scene.decision.state === "idle" ? "…" : (scene.decision.value ?? "(trống)")}</span>
          <Mark state={scene.decision.state} />
        </p>
      )}
      {scene.lamps.length > 0 && (
        <ul className="patrol-lamps" aria-label="Đèn báo của drone">
          {scene.lamps.map((l) => (
            <li key={l.name} className={`patrol-lamp is-${l.state}`}>
              <span className="patrol-lamp-dot" aria-hidden="true" />
              <span className="patrol-lamp-name">{l.label}</span>
              <span className="patrol-lamp-value">{l.state === "idle" ? "…" : (l.value ?? "(không có)")}</span>
              <Mark state={l.state} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Patrol strip (chapter 2): one situation per base test, then OMNI changes the patrol rules. Plays a pure timeline back. */
export function PatrolSimulation({ level, outcome, running, playing, onDone, onCue }: Props) {
  const frames = useMemo(() => (outcome ? buildPatrolTimeline(outcome, level) : []), [outcome, level]);
  const { frame, skip, reduced } = useTimelinePlayback(frames, { playing, onDone, onCue });
  const scene = running ? patrolRunningScene(level) : (frame?.scene ?? patrolIdleScene(level));
  const summary = !running && !playing && frames.length ? summarizePatrol(frames) : "";
  const alarm = scene.drone === "locked" || scene.compileError || scene.sentinel;

  return (
    <div className={`sim patrol${scene.wave === "counter" ? " is-counter" : ""}`}>
      {scene.banner && (
        <div className="sim-banner" role="status">
          <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
            <path d="M8 1.5 L15 14.5 H1 Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 6v4M8 11.6v.8" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          {scene.banner}
        </div>
      )}
      <ol className="patrol-situations" aria-label="Tình huống">
        {scene.situations.map((st, i) => (
          <li key={i} className={`patrol-situation is-${st}`}>
            {`${i + 1}${SITUATION_TEXT[st] ? ` · ${SITUATION_TEXT[st]}` : ""}`}
          </li>
        ))}
        {scene.wave === "counter" && <li className="patrol-situation is-counter">OMNI ĐỔI LUẬT</li>}
      </ol>
      <div className="patrol-stage">
        <Strip scene={scene} place={level.location ?? "Vành Sentinel"} />
      </div>
      <Sensors scene={scene} />
      <Readout scene={scene} />
      {scene.slots.length + scene.extra.length > 0 && (
        <OutputSlots slots={scene.slots} extra={scene.extra} wave={`${scene.wave}-${scene.round ?? 0}`} label="Dòng báo gửi drone" />
      )}
      <div className="sim-foot">
        <p className={`sim-status ${scene.gate === "open" ? "scanner-pass" : alarm ? "scanner-alarm" : scene.drone === "sweep" ? "scanner-scanning" : ""}`}>
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
