import { useMemo } from "react";
import type { Cue } from "../audio/sound-recipes";
import type { RunOutcome } from "../game/classify-run";
import type { LevelDefinition } from "../game/level-types";
import { visible, type DiffSegments } from "../game/output-diff";
import { buildRelayTimeline, relayIdleScene, relayRunningScene, stationOf, summarizeRelay, type RelayScene, type RelaySlot } from "./relay-timeline";
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
const VIEW_H = 315;
const MAST_X = 150;
const MAST_TOP = 46;
const ROOF_Y = 118;
const LAPTOP = { x: 18, y: 222, w: 104, h: 62 };
const GRID = { x0: 222, x1: 404, y0: 34, y1: 292, step: 18 };
const EDGE = { x: 404, y: 70 };

/** Dead stations of the blind network: a fixed scatter, brighter where the beam lands. */
const DOTS = (() => {
  const dots: { x: number; y: number; r: number }[] = [];
  let seed = 17;
  const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  for (let y = GRID.y0; y <= GRID.y1; y += GRID.step)
    for (let x = GRID.x0; x <= GRID.x1; x += GRID.step) if (rnd() > 0.35) dots.push({ x, y, r: rnd() > 0.85 ? 2 : 1.3 });
  return dots;
})();

function Segments({ s }: { s: DiffSegments }) {
  return (
    <>
      {s.before}
      <mark>{s.mark}</mark>
      {s.after}
    </>
  );
}

function SlotRow({ slot }: { slot: RelaySlot }) {
  return (
    <li className={`relay-slot is-${slot.state}`}>
      <span className="relay-slot-line">{slot.state === "extra" ? "+" : `dòng ${slot.line}`}</span>
      <span className="relay-slot-text">{visible(slot.expected)}</span>
      <span className="relay-slot-state">{slot.label ?? "CHỜ"}</span>
      {slot.state === "dropped" && slot.diff && (
        <span className="relay-diff">
          <span>
            cần:{"  "}
            <Segments s={slot.diff.need} />
          </span>
          <span>
            nhận: <Segments s={slot.diff.got} />
            {slot.diff.codePoint && ` · ${slot.diff.codePoint}`}
          </span>
        </span>
      )}
    </li>
  );
}

function Scene({ scene, station }: { scene: RelayScene; station: string }) {
  const activeSlot = scene.active === null ? null : [...scene.slots, ...scene.extra][scene.active];
  const wire = `M${LAPTOP.x + LAPTOP.w - 10} ${LAPTOP.y} C ${LAPTOP.x + LAPTOP.w + 10} 170, ${MAST_X - 20} 160, ${MAST_X} ${ROOF_Y}`;
  const beamEnd = scene.reachedEdge ? EDGE : { x: (GRID.x0 + GRID.x1) / 2, y: 150 };
  return (
    <svg className="sim-svg relay-svg" viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} preserveAspectRatio="xMidYMid meet" role="img" aria-label={`Mô phỏng trạm chuyển tiếp ${station}`}>
      {/* blind network */}
      <g className="relay-grid" aria-hidden="true">
        {DOTS.map((d, i) => (
          <circle key={i} cx={d.x} cy={d.y} r={d.r} />
        ))}
      </g>
      {Array.from({ length: scene.wavesLit }, (_, i) => (
        <path key={`lit-${scene.wave}-${i}`} className="relay-lit" d={`M${MAST_X + 18 + i * 16} ${MAST_TOP - 22 - i * 4} q ${26 + i * 8} ${36 + i * 6} 0 ${72 + i * 14}`} aria-hidden="true" />
      ))}
      {scene.channel !== "closed" && (
        <line className={`relay-beam is-${scene.channel}`} x1={MAST_X} y1={MAST_TOP} x2={beamEnd.x} y2={beamEnd.y} aria-hidden="true" />
      )}
      {scene.reachedEdge && <circle className="relay-stranger" cx={EDGE.x} cy={EDGE.y} r={4} aria-hidden="true" />}

      {/* rooftop and antenna */}
      <g className={`relay-antenna is-${scene.antenna}`} aria-hidden="true">
        <path className="relay-roof" d={`M${MAST_X - 70} ${ROOF_Y + 14} L${MAST_X - 40} ${ROOF_Y} H${MAST_X + 50} L${MAST_X + 66} ${ROOF_Y + 14}`} />
        <path className="relay-mast" d={`M${MAST_X} ${ROOF_Y} V${MAST_TOP} M${MAST_X - 14} ${ROOF_Y} L${MAST_X} ${MAST_TOP + 30} L${MAST_X + 14} ${ROOF_Y} M${MAST_X - 10} ${MAST_TOP + 14} H${MAST_X + 10}`} />
        <circle className="relay-tip" cx={MAST_X} cy={MAST_TOP} r={4} />
        <text x={MAST_X + 20} y={ROOF_Y - 6} className="sim-label">
          {station}
        </text>
      </g>
      {scene.antenna === "flash" && (
        <g key={`ring-${scene.wave}-${scene.active}`} className="relay-ring" aria-hidden="true">
          <circle cx={MAST_X} cy={MAST_TOP} r={26} />
        </g>
      )}

      {/* wire and laptop */}
      <path className="relay-wire" d={wire} aria-hidden="true" />
      <g className={`relay-laptop is-${scene.laptop}`} aria-hidden="true">
        <rect x={LAPTOP.x} y={LAPTOP.y} width={LAPTOP.w} height={LAPTOP.h} className="relay-laptop-body" />
        <rect x={LAPTOP.x + 6} y={LAPTOP.y + 6} width={LAPTOP.w - 12} height={LAPTOP.h - 16} className="relay-laptop-screen" />
        <path d={`M${LAPTOP.x - 8} ${LAPTOP.y + LAPTOP.h + 6} H${LAPTOP.x + LAPTOP.w + 8}`} className="relay-laptop-base" />
        {scene.laptop === "compile_error" ? (
          <text x={LAPTOP.x + LAPTOP.w / 2} y={LAPTOP.y + 32} textAnchor="middle" className="relay-laptop-error">
            TỪ CHỐI
          </text>
        ) : (
          <text x={LAPTOP.x + 12} y={LAPTOP.y + 24} className="relay-laptop-prompt">
            {">_"}
          </text>
        )}
      </g>

      {/* the packet of this frame: travels up the wire, breaks at the foot of the mast when dropped */}
      {activeSlot && (
        <g key={`pkt-${scene.wave}-${scene.active}`} className={`relay-packet is-${activeSlot.state}`} aria-hidden="true">
          <rect x={-9} y={-6} width={18} height={12} />
        </g>
      )}

      <g className={`sentinel${scene.sentinel ? " is-on" : ""}`} aria-hidden="true">
        <circle cx={VIEW_W - 16} cy={18} r={7} className="sentinel-lamp" />
        <text x={VIEW_W - 30} y={22} className="sim-label" textAnchor="end">
          SENTINEL
        </text>
      </g>
    </svg>
  );
}

/** Relay station scene (level 1.1): output lines go up the wire as packets. Plays a pure timeline back. */
export function RelaySimulation({ level, outcome, running, playing, onDone, onCue }: Props) {
  const frames = useMemo(() => (outcome ? buildRelayTimeline(outcome, level) : []), [outcome, level]);
  const { frame, skip, reduced } = useTimelinePlayback(frames, { playing, onDone, onCue });
  const scene = running ? relayRunningScene(level) : (frame?.scene ?? relayIdleScene(level));
  const summary = !running && !playing && frames.length ? summarizeRelay(frames, level) : "";
  const alarm = scene.status.startsWith("KÊNH VỀ") || scene.sentinel || scene.laptop === "compile_error" || scene.slots.some((s) => s.state === "error");

  return (
    <div className={`sim relay${scene.shake && !reduced ? " is-shaking" : ""}${scene.wave === "counter" ? " is-counter" : ""}`}>
      {scene.banner && (
        <div className="sim-banner" role="status">
          <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
            <path d="M8 1.5 L15 14.5 H1 Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 6v4M8 11.6v.8" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          {scene.banner}
        </div>
      )}
      <div className="relay-stage">
        <Scene scene={scene} station={stationOf(level)} />
      </div>
      <ol className="relay-list" aria-label="Danh sách phát">
        {[...scene.slots, ...scene.extra].map((s) => (
          <SlotRow key={`${scene.wave}-${s.state === "extra" ? "x" : ""}${s.line}`} slot={s} />
        ))}
      </ol>
      <div className="sim-foot">
        <p className="sim-chip">{scene.chip ? `> ${scene.chip}` : ""}</p>
        <p className={`sim-status ${scene.channel === "open" ? "scanner-pass" : alarm ? "scanner-alarm" : scene.status === "ĐANG XỬ LÝ" ? "scanner-scanning" : ""}`}>
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
