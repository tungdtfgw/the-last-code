import type { Cue } from "../audio/sound-recipes";
import type { RunOutcome, VarVerdict } from "../game/classify-run";
import { simulationOf, type InputValue, type LevelDefinition } from "../game/level-types";
import { errorStatus, inputsLabel } from "./scanner-timeline";
import { toneOf, type TypeTone } from "./type-colors";

/** Most full cells drawn on the rack; a bigger count is written next to it. */
export const MAX_CELLS = 16;

export type FenceState = "lit" | "half" | "off" | "discharge";
export type MeterState = "idle" | "exact" | "short" | "over" | "negative";
export type FenceSignal = "idle" | "scanning" | "pass" | "reject" | "alarm";

export interface FenceCell {
  tone: TypeTone;
  /** `cut`: a cell of the wrong shape (a fraction of a cell), the rack refuses it. */
  state: "full" | "cut";
}

export interface FenceMeter {
  /** The energy the code computed; null when there is no number to read. */
  value: number | null;
  /** The mark: the energy this wave expects. */
  need: number;
  state: MeterState;
  label: string;
}

export interface FenceScene {
  wave: "base" | "counter";
  /** Fence posts: the segment count of this wave's inputs. */
  posts: number;
  /** Charge of one full cell (the capacity input). */
  capacity: number | null;
  /** Input line in Python syntax (`so_doan = 6  dien_ap = 12 …`). */
  chip: string;
  cells: FenceCell[];
  /** Cells beyond `MAX_CELLS`, written as `+n`. */
  moreCells: number;
  /** The odd cell drawn from one more battery: `fill` of a full cell (0..1). */
  partial: { fill: number; tone: TypeTone; state: "full" | "cut" } | null;
  rackLabel: string;
  meter: FenceMeter;
  fence: FenceState;
  signal: FenceSignal;
  status: string;
  banner: string | null;
  sentinel: boolean;
  shake: boolean;
}

export interface FenceFrame {
  scene: FenceScene;
  hold: number;
  cues: Cue[];
}

interface Roles {
  energy: string;
  cells: string;
  remainder: string;
  capacity: string;
}

function rolesOf(level: LevelDefinition): Roles {
  const sim = simulationOf(level);
  if (sim.kind === "fence") return sim;
  // Only fence levels reach this scene; fall back on the first objectives.
  const vars = level.objectives.map((o) => ("var" in o ? o.var : "")).filter(Boolean);
  return { energy: vars[0] ?? "", cells: vars[1] ?? "", remainder: vars[2] ?? "", capacity: level.inputs.at(-1) ?? "" };
}

const asNumber = (v: InputValue | undefined) => (typeof v === "number" && Number.isFinite(v) ? v : null);

/** Number read from a harness preview (`828`, `-1.06`, `8.0`); anything else is null. */
export function previewNumber(v: VarVerdict | undefined): number | null {
  if (!v?.present || (v.type !== "int" && v.type !== "float") || v.preview === null) return null;
  const n = Number(v.preview);
  return Number.isFinite(n) ? n : null;
}

const byName = (vars: VarVerdict[], name: string) => vars.find((v) => v.name === name);

export function meterOf(value: number | null, need: number): FenceMeter {
  if (value === null) return { value, need, state: "idle", label: "KHÔNG ĐỌC ĐƯỢC NĂNG LƯỢNG" };
  if (value < 0) return { value, need, state: "negative", label: "NĂNG LƯỢNG ÂM" };
  if (value === need) return { value, need, state: "exact", label: "ĐÚNG VẠCH" };
  const gap = Math.abs(need - value);
  const units = Number.isInteger(gap) ? String(gap) : gap.toFixed(2);
  return value < need
    ? { value, need, state: "short", label: `THIẾU ${units} ĐƠN VỊ` }
    : { value, need, state: "over", label: `THỪA ${units} ĐƠN VỊ` };
}

/** Full cells on the rack: whole cells of the right shape, or cut cells of the wrong one. */
function cellsOf(v: VarVerdict | undefined): { cells: FenceCell[]; more: number } {
  if (!v?.present) return { cells: [], more: 0 };
  const tone = toneOf(v.type);
  const n = previewNumber(v);
  if (!v.typeOk) {
    const count = n === null ? 1 : Math.min(MAX_CELLS, Math.max(1, Math.floor(Math.abs(n))));
    return { cells: Array.from({ length: count }, () => ({ tone, state: "cut" })), more: 0 };
  }
  const whole = n === null ? 0 : Math.max(0, Math.floor(n));
  return { cells: Array.from({ length: Math.min(whole, MAX_CELLS) }, () => ({ tone, state: "full" })), more: Math.max(0, whole - MAX_CELLS) };
}

function partialOf(v: VarVerdict | undefined, capacity: number | null): FenceScene["partial"] {
  if (!v?.present) return null;
  const n = previewNumber(v);
  const fill = n === null || capacity === null || capacity <= 0 ? 0 : Math.min(1, Math.max(0, n / capacity));
  return { fill, tone: toneOf(v.type), state: v.typeOk ? "full" : "cut" };
}

/** What the rack says about the full cells and the odd one (empty when both are right). */
function rackLabelOf(vars: VarVerdict[], roles: Roles, expected: Record<string, unknown>): string {
  const cells = byName(vars, roles.cells);
  const rem = byName(vars, roles.remainder);
  if (!cells?.present || !rem?.present) return "GIÁ PIN TRỐNG";
  if (!cells.typeOk || !rem.typeOk) return "PIN KHÔNG CẮT ĐƯỢC";
  if (!cells.valueOk) {
    const got = previewNumber(cells);
    const want = expected[roles.cells];
    if (got !== null && typeof want === "number") return got > want ? `THỪA ${got - want} PIN` : `THIẾU ${want - got} PIN`;
    return "SỐ PIN LỆCH";
  }
  if (!rem.valueOk) return "PIN LẺ LỆCH";
  return "";
}

/** First problem of a wave, in grading order: missing, shape, energy, cells. */
function failureOf(vars: VarVerdict[], roles: Roles, meter: FenceMeter, rackLabel: string): string {
  const missing = vars.find((v) => !v.present);
  if (missing) return `${missing.name}: KHÔNG CÓ TÍN HIỆU`;
  const energy = byName(vars, roles.energy);
  const cellShape = [roles.cells, roles.remainder].some((n) => byName(vars, n)?.typeOk === false);
  if (cellShape) return "PIN KHÔNG CẮT ĐƯỢC";
  if (energy && !energy.typeOk) return `NĂNG LƯỢNG SAI HÌNH DẠNG: ${energy.type}`;
  if (energy && !energy.valueOk) return meter.label;
  return rackLabel || "RÀO TỪ CHỐI";
}

const overshoots = (meter: FenceMeter, rackLabel: string) => meter.state === "over" || rackLabel.startsWith("THỪA");

function waveScene(level: LevelDefinition, inputs: Record<string, InputValue>, need: number, wave: FenceScene["wave"]): FenceScene {
  const roles = rolesOf(level);
  return {
    wave,
    posts: Math.min(12, Math.max(1, asNumber(inputs[level.inputs[0]]) ?? 1)),
    capacity: asNumber(inputs[roles.capacity]),
    chip: inputsLabel(level, inputs),
    cells: [],
    moreCells: 0,
    partial: null,
    rackLabel: "",
    meter: { value: null, need, state: "idle", label: "" },
    fence: "lit",
    signal: "scanning",
    status: "",
    banner: null,
    sentinel: false,
    shake: false,
  };
}

const needOf = (level: LevelDefinition, which: "tests" | "counter_attack_tests") => {
  const v = level[which][0]?.expected[rolesOf(level).energy];
  return typeof v === "number" ? v : 0;
};

/** While Python runs: the fence lit, the rack empty. */
export function runningFenceScene(level: LevelDefinition): FenceScene {
  return { ...waveScene(level, level.tests[0]?.inputs ?? {}, needOf(level, "tests"), "base"), status: "ĐANG XỬ LÝ" };
}

export function idleFenceScene(level: LevelDefinition): FenceScene {
  return { ...runningFenceScene(level), signal: "idle", status: "CHỜ NĂNG LƯỢNG" };
}

/**
 * One wave: the meter reads the computed energy, the full cells slide onto the
 * rack one by one, then the odd cell. Returns the settled scene.
 */
function playWave(
  vars: VarVerdict[],
  start: FenceScene,
  level: LevelDefinition,
  expected: Record<string, unknown>,
  frames: FenceFrame[],
  fast: boolean,
): FenceScene {
  const roles = rolesOf(level);
  const meter = meterOf(previewNumber(byName(vars, roles.energy)), start.meter.need);
  const metered = { ...start, meter, status: meter.label };
  frames.push({ scene: metered, hold: fast ? 450 : 700, cues: [meter.state === "exact" ? "scan_pass" : "scan_reject"] });

  const { cells, more } = cellsOf(byName(vars, roles.cells));
  // At most eight frames of cells sliding in, a click each; big counts arrive in batches.
  const steps = Math.min(cells.length, 8);
  for (let k = 1; k <= steps; k++) {
    const shown = Math.round((cells.length * k) / steps);
    frames.push({ scene: { ...metered, cells: cells.slice(0, shown) }, hold: fast ? 90 : 140, cues: ["key_blip"] });
  }
  const rackLabel = rackLabelOf(vars, roles, expected);
  return { ...metered, cells, moreCells: more, partial: partialOf(byName(vars, roles.remainder), start.capacity), rackLabel };
}

/** Pure description of the fence animation for an outcome; the component only plays it back. */
export function buildFenceTimeline(outcome: RunOutcome, level: LevelDefinition): FenceFrame[] {
  const roles = rolesOf(level);
  const start = runningFenceScene(level);
  const frames: FenceFrame[] = [{ scene: start, hold: 450, cues: [] }];

  const graded = outcome.basePassed || (!outcome.error && !outcome.stopStatus && outcome.key !== "engine_error");
  if (!graded) {
    // Python errors, timeouts, blocked imports: no energy leaves the laptop.
    frames.push({ scene: { ...start, signal: "alarm", status: errorStatus(outcome) }, hold: 0, cues: ["alarm"] });
    return frames;
  }

  const baseExpected = level.tests[0]?.expected ?? {};
  const base = playWave(outcome.vars, { ...start, status: "" }, level, baseExpected, frames, false);

  if (!outcome.basePassed) {
    const over = overshoots(base.meter, base.rackLabel);
    frames.push({
      scene: { ...base, fence: over ? "discharge" : "lit", signal: "reject", status: failureOf(outcome.vars, roles, base.meter, base.rackLabel) },
      hold: 0,
      cues: ["scan_reject"],
    });
    return frames;
  }
  if (outcome.sentinelCaught) {
    frames.push({ scene: { ...base, signal: "alarm", status: "SENTINEL ĐÃ KHÓA MỤC TIÊU", sentinel: true }, hold: 0, cues: ["alarm"] });
    return frames;
  }
  const loud = outcome.stars === 1;
  frames.push({
    scene: { ...base, fence: "half", signal: "pass", status: loud ? "TÍN HIỆU BỊ GHI NHẬN" : "RÀO TẮT MỘT NỬA", sentinel: loud },
    hold: outcome.counterVars || outcome.counterAborted ? 700 : 0,
    cues: ["gate_open"],
  });
  if (!outcome.counterVars && !outcome.counterAborted && outcome.error?.phase !== "counter") return frames;

  // Counter-attack: new load, new meter mark, a second batch of cells.
  const counterInputs = outcome.counterInputs ?? level.counter_attack_tests[0]?.inputs ?? {};
  const counter: FenceScene = {
    ...waveScene(level, counterInputs, needOf(level, "counter_attack_tests"), "counter"),
    fence: "half",
    banner: level.counter_attack_banner ?? "CẢNH BÁO: OMNI ĐÃ THAY ĐỔI DỮ LIỆU",
    sentinel: loud,
  };
  frames.push({ scene: { ...counter, status: "OMNI PHẢN CÔNG", shake: true }, hold: 1200, cues: ["siren"] });

  if (outcome.counterAborted || outcome.error?.phase === "counter" || !outcome.counterVars) {
    const why =
      outcome.counterAborted === "engine_error"
        ? "LÕI PYTHON KHÔNG PHẢN HỒI"
        : outcome.counterAborted || outcome.key === "timeout" || outcome.key === "counter_timeout"
          ? "TIẾN TRÌNH BỊ CẮT"
          : `${outcome.error?.type ?? "LỖI"}: dòng ${outcome.error?.line ?? "?"}`;
    frames.push({ scene: { ...counter, signal: "alarm", status: `RÀO SÁNG LẠI MỘT NỬA · ${why}` }, hold: 0, cues: ["alarm"] });
    return frames;
  }

  const cExpected = level.counter_attack_tests[0]?.expected ?? {};
  const settled = playWave(outcome.counterVars, counter, level, cExpected, frames, true);
  if (outcome.counterSurvived) {
    const open = outcome.stars === 3;
    frames.push({
      scene: { ...settled, banner: null, fence: open ? "off" : "half", signal: "pass", status: open ? "RÀO TẮT HOÀN TOÀN" : "TÍN HIỆU BỊ GHI NHẬN" },
      hold: 0,
      cues: open ? ["gate_open", "star"] : ["gate_open"],
    });
    return frames;
  }
  const why = failureOf(outcome.counterVars, roles, settled.meter, settled.rackLabel);
  if (overshoots(settled.meter, settled.rackLabel))
    frames.push({ scene: { ...settled, fence: "discharge", signal: "reject", status: why }, hold: 700, cues: ["scan_reject"] });
  frames.push({ scene: { ...settled, fence: "half", signal: "alarm", status: `RÀO SÁNG LẠI MỘT NỬA · ${why}` }, hold: 0, cues: ["alarm"] });
  return frames;
}

/** One sentence for screen readers: "Rào nhận 828 trên 828 đơn vị. Rào tắt một nửa." */
export function summarizeFence(frames: FenceFrame[]): string {
  const last = frames.at(-1)?.scene;
  if (!last) return "";
  const fence = last.fence === "off" ? "Rào tắt hoàn toàn" : last.fence === "half" ? "Rào tắt một nửa" : last.fence === "discharge" ? "Rào phóng điện" : "Rào vẫn sáng";
  const head = last.meter.value === null ? last.status : `Rào nhận ${last.meter.value} trên ${last.meter.need} đơn vị`;
  return `${head}. ${fence}.`;
}
