import { useMemo, type CSSProperties } from "react";
import type { Cue } from "../audio/sound-recipes";
import type { RunOutcome } from "../game/classify-run";
import type { LevelDefinition } from "../game/level-types";
import {
  VERDICT_LABEL,
  buildKioskTimeline,
  idleKioskScene,
  runningKioskScene,
  summarizeKiosk,
  type KioskScene,
  type Slot,
} from "./kiosk-timeline";
import { useTimelinePlayback } from "./use-timeline-playback";

interface Props {
  level: LevelDefinition;
  outcome: RunOutcome | null;
  running: boolean;
  playing: boolean;
  onDone(): void;
  onCue(cue: Cue, delayMs?: number): void;
}

const W = 420;
const PAD = 12;
const BUF_Y = 30;
const BUF_H = 46;
const CELLS_TOP = 132;
const CELL_GAP = 12;
const CELL_W = (W - 2 * PAD - CELL_GAP) / 2;
const CELL_H = 50;
const ROW_GAP = 100;
const DEV_W = 300;
const DEV_H = 38;
const DEV_GAP = 64;
const CELL_CHARS = 14;
const DEV_CHARS = 26;

const clip = (text: string, max: number) => (text.length > max ? text.slice(0, max - 1) + "…" : text);

interface Layout {
  cards: { name: string; x: number; w: number }[];
  cells: Record<string, { x: number; y: number; w: number; h: number }>;
  devTop: number;
  height: number;
}

function layout(scene: KioskScene): Layout {
  const n = Math.max(1, scene.buffer.length);
  const cw = (W - 2 * PAD - (n - 1) * 8) / n;
  const cards = scene.buffer.map((b, i) => ({ name: b.name, x: PAD + i * (cw + 8), w: cw }));
  const memory = scene.slots.filter((s) => !s.device);
  const devices = scene.slots.filter((s) => s.device);
  const cells: Layout["cells"] = {};
  memory.forEach((s, i) => {
    cells[s.name] = { x: PAD + (i % 2) * (CELL_W + CELL_GAP), y: CELLS_TOP + Math.floor(i / 2) * ROW_GAP, w: CELL_W, h: CELL_H };
  });
  const devTop = CELLS_TOP + Math.ceil(memory.length / 2) * ROW_GAP + 14;
  devices.forEach((s, j) => {
    cells[s.name] = { x: PAD, y: devTop + j * DEV_GAP, w: DEV_W, h: DEV_H };
  });
  return { cards, cells, devTop, height: devTop + devices.length * DEV_GAP + 4 };
}

/** Reader title from the objective label: "Máy quét drone đọc: …" → "MÁY QUÉT DRONE ĐỌC". */
const deviceTitle = (s: Slot) => (s.label.split(":")[0] || s.name).toUpperCase();

function CellView({ slot, box }: { slot: Slot; box: Layout["cells"][string] }) {
  const max = slot.device ? DEV_CHARS : CELL_CHARS;
  const cls = `kiosk-slot${slot.device ? " is-device" : ""}${slot.lit ? " is-lit" : ""}${slot.verdict ? ` is-${slot.verdict}` : ""}`;
  const tagW = Math.min(box.w, slot.name.length * 7.6 + 16);
  return (
    <g className={cls} data-slot={slot.name} data-verdict={slot.verdict ?? ""}>
      <title>{`${slot.name} = ${slot.value ?? "(trống)"}`}</title>
      {slot.device ? (
        <text x={box.x} y={box.y - 8} className="sim-label kiosk-device-title">
          {deviceTitle(slot)}
        </text>
      ) : (
        <g className="kiosk-tag">
          <line x1={box.x + tagW / 2} x2={box.x + tagW / 2} y1={box.y - 4} y2={box.y} />
          <rect x={box.x} y={box.y - 22} width={tagW} height={18} />
          <text x={box.x + 8} y={box.y - 9}>
            {slot.name}
          </text>
        </g>
      )}
      <rect x={box.x} y={box.y} width={box.w} height={box.h} className="kiosk-cell" />
      {slot.noise && <rect x={box.x} y={box.y} width={box.w} height={box.h} fill="url(#kiosk-hazard)" className="kiosk-noise" />}
      <text x={box.x + 10} y={box.y + box.h / 2 + 5} className="kiosk-value">
        {slot.value === null ? "" : clip(slot.value, max)}
      </text>
      {slot.verdict && (
        <text x={box.x + box.w} y={box.y + box.h + 15} textAnchor="end" className="kiosk-verdict">
          {VERDICT_LABEL[slot.verdict]}
        </text>
      )}
    </g>
  );
}

function Scene({ scene }: { scene: KioskScene }) {
  const L = layout(scene);
  const devices = scene.slots.filter((s) => s.device);
  const gateX = PAD + DEV_W + 24;
  const gateTop = L.devTop - 4;
  const gateH = Math.max(40, devices.length * DEV_GAP - 26);
  const centre = (name: string) => {
    const c = L.cells[name];
    return c ? { x: c.x + 10, y: c.y + c.h / 2 } : null;
  };
  return (
    <svg className="sim-svg kiosk-svg" viewBox={`0 0 ${W} ${L.height}`} preserveAspectRatio="xMidYMid meet" role="img" aria-label="Mô phỏng ki-ốt ô nhớ có nhãn">
      <defs>
        <pattern id="kiosk-hazard" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="5" height="10" fill="var(--omni)" opacity="0.35" />
        </pattern>
      </defs>

      {/* 0xA7 buffer strip */}
      <text x={PAD} y={BUF_Y - 10} className="sim-label">
        BỘ ĐỆM 0xA7
      </text>
      {scene.buffer.map((b, i) => {
        const c = L.cards[i];
        return (
          <g key={`${scene.wave}-${b.name}`} className="kiosk-card">
            <title>{`${b.name} = ${b.value}`}</title>
            <rect x={c.x} y={BUF_Y} width={c.w} height={BUF_H} />
            <text x={c.x + 7} y={BUF_Y + 16} className="kiosk-card-name">
              {b.name}
            </text>
            <text x={c.x + 7} y={BUF_Y + 35} className="kiosk-card-value">
              {clip(b.value, Math.max(4, Math.floor((c.w - 12) / 7.2)))}
            </text>
          </g>
        );
      })}

      {/* wires: buffer card → cell copied from it (identity, not equality) */}
      {scene.slots.map((s) => {
        const card = s.wire ? L.cards.find((c) => c.name === s.wire) : undefined;
        const box = L.cells[s.name];
        if (!card || !box) return null;
        // Bus routing: down from the card, along the gap between the two columns, then into the tag.
        const x1 = card.x + card.w / 2;
        const y1 = BUF_Y + BUF_H;
        const x2 = box.x + 18;
        const y2 = box.y - 22;
        const d = `M${x1} ${y1} V${y1 + 10} H${W / 2} V${y2 - 6} H${x2} V${y2}`;
        return <path key={`w-${scene.wave}-${s.name}-${s.wire}`} className={`kiosk-wire${s.lit ? " is-new" : ""}`} d={d} aria-hidden="true" />;
      })}

      {scene.slots.map((s) => (L.cells[s.name] ? <CellView key={s.name} slot={s} box={L.cells[s.name]} /> : null))}

      {/* overwritten values: fly to the cell holding the same value, or fade */}
      {scene.ghosts.map((g) => {
        const from = centre(g.from);
        const to = g.to ? centre(g.to) : null;
        if (!from) return null;
        const style = { "--dx": `${to ? to.x - from.x : 0}px`, "--dy": `${to ? to.y - from.y : -26}px` } as CSSProperties;
        return (
          <g key={g.id} className={`kiosk-ghost${to ? " is-flying" : ""}`} style={style} aria-hidden="true">
            <text x={from.x} y={from.y + 5}>
              {clip(g.value, CELL_CHARS)}
            </text>
          </g>
        );
      })}

      {/* zone gate */}
      <g className={`kiosk-gate is-${scene.gate}`} aria-hidden="true">
        <rect x={gateX} y={gateTop} width={W - PAD - gateX} height={gateH} className="kiosk-gate-frame" />
        <rect x={gateX + 4} y={gateTop + 4} width={(W - PAD - gateX) / 2 - 4} height={gateH - 8} className="kiosk-gate-leaf is-left" />
        <rect x={gateX + (W - PAD - gateX) / 2} y={gateTop + 4} width={(W - PAD - gateX) / 2 - 4} height={gateH - 8} className="kiosk-gate-leaf is-right" />
      </g>

      {/* patrol drone */}
      <g className={`kiosk-drone is-${scene.drone}`} aria-hidden="true">
        <g className="kiosk-drone-body">
          <path d="M-16 -6 h10 M6 -6 h10 M-11 -6 v4 M11 -6 v4" />
          <ellipse cx={0} cy={0} rx={10} ry={4} />
          <circle cx={0} cy={4} r={1.6} className="kiosk-drone-eye" />
        </g>
      </g>
    </svg>
  );
}

/** Labelled-memory kiosk (level 1.2): plays the assignment history back after the run. */
export function KioskSimulation({ level, outcome, running, playing, onDone, onCue }: Props) {
  const frames = useMemo(() => (outcome ? buildKioskTimeline(outcome, level) : []), [outcome, level]);
  const { frame, skip, reduced } = useTimelinePlayback(frames, { playing, onDone, onCue });
  const scene = running ? runningKioskScene(level) : (frame?.scene ?? idleKioskScene(level));
  const summary = !running && !playing && frames.length ? summarizeKiosk(frames) : "";
  const alarm = scene.slots.some((s) => s.noise || (s.verdict && s.verdict !== "ok")) || scene.drone === "locked" || scene.status.startsWith("TRUY VẾT");

  return (
    <div data-testid="kiosk" className={`sim kiosk${scene.shake && !reduced ? " is-shaking" : ""}${scene.wave === "counter" ? " is-counter" : ""}`}>
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
        <p className={`sim-status ${scene.gate === "open" ? "scanner-pass" : alarm ? "scanner-alarm" : scene.status === "ĐANG XỬ LÝ" ? "scanner-scanning" : ""}`}>
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
