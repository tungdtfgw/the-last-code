import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Cue } from "../audio/sound-recipes";
import type { RunOutcome } from "../game/classify-run";
import type { LevelDefinition } from "../game/level-types";
import { buildTimeline, idleScene, runningScene, summarize, type Packet, type PacketStage, type Scene } from "./scanner-timeline";
import { toneVar } from "./type-colors";
import { useReducedMotion } from "./use-reduced-motion";

interface Props {
  level: LevelDefinition;
  outcome: RunOutcome | null;
  running: boolean;
  playing: boolean;
  onDone(): void;
  /** `delayMs` schedules the cue on the audio clock (no JS timer that a re-render could cancel). */
  onCue(cue: Cue, delayMs?: number): void;
}

const VIEW_W = 420;
const VIEW_H = 470;
const SCANNER_X = 236;
const GATE_X = 336;
const LANE_TOP = 160;
const LANE_GAP = 104;
const TOP = 100;
const BOTTOM = 420;

const STAGE_X: Record<PacketStage, number> = {
  source: 98,
  empty: 98,
  bounced: 128,
  scanner: SCANNER_X,
  broken: SCANNER_X,
  gate: 288,
  through: 382,
};

const clip = (text: string, max: number) => (text.length > max ? text.slice(0, Math.max(1, max - 1)) + "…" : text);

function PacketView({ packet, lane }: { packet: Packet; lane: number }) {
  const x = STAGE_X[packet.stage];
  const y = LANE_TOP + lane * LANE_GAP;
  const w = packet.stage === "through" || packet.stage === "gate" ? Math.min(packet.width, 64) : packet.stage === "scanner" ? Math.min(packet.width, 120) : packet.width;
  const h = 34;
  const color = toneVar(packet.tone);
  const bad = packet.stage === "bounced" || packet.stage === "broken";
  return (
    <g className={`packet stage-${packet.stage}${bad ? " is-bad" : ""}`} style={{ transform: `translate(${x}px, ${y}px)` }}>
      {packet.stage !== "gate" && packet.stage !== "through" && (
        <text className="packet-name" x={-w / 2} y={-h / 2 - 8}>
          {packet.name}
        </text>
      )}
      {packet.stage === "empty" ? (
        <>
          <rect x={-w / 2} y={-h / 2} width={w} height={h} className="packet-empty" />
          <text className="packet-verdict tone-muted" x={-w / 2} y={h / 2 + 17}>
            KHÔNG CÓ TÍN HIỆU
          </text>
        </>
      ) : packet.stage === "broken" ? (
        <g className="packet-shards" style={{ color }}>
          {[-1, 0, 1].map((k) => (
            <rect key={k} x={k * 20 - 8} y={-h / 2 + (k === 0 ? 4 : 0)} width={16} height={h - 6} transform={`rotate(${k * 18})`} className="packet-body" />
          ))}
        </g>
      ) : (
        <g style={{ color }}>
          <rect x={-w / 2} y={-h / 2} width={w} height={h} className="packet-body" />
          <rect x={-w / 2} y={-h / 2} width={34} height={h} className="packet-tag" />
          <text className="packet-type" x={-w / 2 + 17} y={4}>
            {packet.typeLabel}
          </text>
          {w > 64 && (
            <text className="packet-preview" x={-w / 2 + 40} y={4}>
              {clip(packet.preview, Math.floor((w - 46) / 7.3))}
            </text>
          )}
        </g>
      )}
      {packet.verdict && packet.stage !== "empty" && (
        <text className={`packet-verdict${bad || packet.verdict === "LỆCH MẪU" ? " tone-alarm" : " tone-ok"}`} x={-w / 2} y={h / 2 + 17}>
          {packet.verdict}
        </text>
      )}
    </g>
  );
}

function GateView({ gate }: { gate: Scene["gate"] }) {
  // Leaves retract into their rails: 1 = closed, 0.1 = fully open.
  const scale = gate === "open" ? 0.1 : gate === "half" ? 0.55 : 1;
  const mid = (TOP + BOTTOM) / 2;
  return (
    <g className={`gate gate-${gate}`} aria-hidden="true">
      <rect x={GATE_X - 14} y={TOP - 6} width={28} height={6} className="gate-rail" />
      <rect x={GATE_X - 14} y={BOTTOM} width={28} height={6} className="gate-rail" />
      <g className="gate-leaf gate-leaf-top" style={{ transform: `scaleY(${scale})` }}>
        <rect x={GATE_X - 9} y={TOP} width={18} height={mid - TOP} className="gate-body" />
        <path d={`M${GATE_X - 9} ${mid - 20} h18 M${GATE_X - 9} ${mid - 40} h18`} className="gate-ribs" />
      </g>
      <g className="gate-leaf gate-leaf-bottom" style={{ transform: `scaleY(${scale})` }}>
        <rect x={GATE_X - 9} y={mid} width={18} height={BOTTOM - mid} className="gate-body" />
        <path d={`M${GATE_X - 9} ${mid + 20} h18 M${GATE_X - 9} ${mid + 40} h18`} className="gate-ribs" />
      </g>
      <text x={GATE_X} y={BOTTOM + 28} className="sim-label" textAnchor="middle">
        CỔNG
      </text>
    </g>
  );
}

function ScannerView({ state }: { state: Scene["scanner"] }) {
  return (
    <g className={`scanner scanner-${state}`} aria-hidden="true">
      <rect x={SCANNER_X - 30} y={TOP} width={60} height={BOTTOM - TOP} className="scanner-frame" />
      {state === "alarm" && <rect x={SCANNER_X - 30} y={TOP} width={60} height={BOTTOM - TOP} fill="url(#hazard)" className="scanner-hazard" />}
      <line x1={SCANNER_X - 30} x2={SCANNER_X + 30} y1={TOP + 6} y2={TOP + 6} className="scanner-beam" />
      <path d={`M${SCANNER_X - 36} ${TOP} v-8 h72 v8 M${SCANNER_X - 36} ${BOTTOM} v8 h72 v-8`} className="scanner-cap" />
      <text x={SCANNER_X} y={BOTTOM + 28} className="sim-label" textAnchor="middle">
        MÁY QUÉT
      </text>
    </g>
  );
}

/** Scanner + gate scene. The timeline is pure data; this only plays it back. */
export function ScannerSimulation({ level, outcome, running, playing, onDone, onCue }: Props) {
  const reduced = useReducedMotion();
  const frames = useMemo(() => (outcome ? buildTimeline(outcome, level) : []), [outcome, level]);
  // Playback position, reset during render whenever a new timeline arrives.
  const [play, setPlay] = useState({ frames, index: 0 });
  if (play.frames !== frames) setPlay({ frames, index: reduced ? Math.max(0, frames.length - 1) : 0 });
  const index = play.frames === frames ? play.index : 0;
  const doneRef = useRef(onDone);
  doneRef.current = onDone;
  const cueRef = useRef(onCue);
  cueRef.current = onCue;

  useEffect(() => {
    if (!playing || play.frames !== frames || frames.length === 0) return;
    const last = frames.length - 1;
    const at = reduced ? last : play.index;
    const frame = frames[at];
    frame.cues.forEach((c, i) => cueRef.current(c, 450 * i));
    if (at >= last) {
      doneRef.current();
      return;
    }
    const id = setTimeout(() => setPlay((p) => (p.frames === frames ? { frames, index: p.index + 1 } : p)), frame.hold);
    return () => {
      clearTimeout(id);
    };
  }, [play, frames, playing, reduced]);

  const skip = useCallback(() => {
    if (!playing || frames.length === 0) return;
    setPlay({ frames, index: frames.length - 1 });
  }, [playing, frames]);

  useEffect(() => {
    if (!playing) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !document.querySelector("dialog[open]")) skip();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [playing, skip]);

  const scene: Scene = running
    ? runningScene(level)
    : frames.length
      ? frames[Math.min(index, frames.length - 1)].scene
      : idleScene(level);
  const summary = !running && !playing && frames.length ? summarize(frames) : "";

  return (
    <div className={`sim${scene.shake && !reduced ? " is-shaking" : ""}${scene.wave === "counter" ? " is-counter" : ""}`}>
      {scene.banner && (
        <div className="sim-banner" role="status">
          <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
            <path d="M8 1.5 L15 14.5 H1 Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 6v4M8 11.6v.8" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          {scene.banner}
        </div>
      )}
      <svg className="sim-svg" viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} preserveAspectRatio="xMidYMid meet" role="img" aria-label="Mô phỏng máy quét và cổng an ninh">
        <defs>
          <pattern id="hazard" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="5" height="10" fill="var(--alarm)" opacity="0.28" />
          </pattern>
        </defs>
        {/* lanes */}
        {level.objectives.map((o, i) => (
          <line key={o.var} x1={12} x2={VIEW_W - 8} y1={LANE_TOP + i * LANE_GAP} y2={LANE_TOP + i * LANE_GAP} className="lane" />
        ))}
        {/* chip source */}
        <g aria-hidden="true">
          <rect x={6} y={TOP} width={186} height={BOTTOM - TOP} className="chip-frame" />
          <text x={10} y={TOP - 12} className="sim-label">
            CHIP NEURAL-ID
          </text>
        </g>
        <ScannerView state={scene.scanner} />
        <GateView gate={scene.gate} />
        {scene.packets.map((p, i) => (
          <PacketView key={`${scene.wave}-${p.name}`} packet={p} lane={i} />
        ))}
        {/* Sentinel */}
        <g className={`sentinel${scene.sentinel ? " is-on" : ""}`} aria-hidden="true">
          <circle cx={VIEW_W - 16} cy={30} r={7} className="sentinel-lamp" />
          <text x={VIEW_W - 30} y={34} className="sim-label" textAnchor="end">
            SENTINEL
          </text>
        </g>
      </svg>
      <div className="sim-foot">
        <p className="sim-chip">{scene.chip ? `> ${scene.chip}` : ""}</p>
        <p className={`sim-status scanner-${scene.scanner}`}>
          {scene.scanner === "alarm" && (
            <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true">
              <path d="M8 1.5 L15 14.5 H1 Z" fill="currentColor" />
            </svg>
          )}
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
