import type { Cue } from "../audio/sound-recipes";
import type { VarHistoryEntry } from "../engine/harness-types";
import type { RunOutcome, VarVerdict } from "../game/classify-run";
import { simulationOf, varObjectives, type InputValue, type LevelDefinition } from "../game/level-types";
import { formatPyLiteral } from "../game/python-literal";
import { gateFor, type GateState } from "../game/terminal-lines";
import { errorStatus } from "./scanner-timeline";

/** One card of the 0xA7 buffer strip: an input and its value in Python syntax. */
export interface BufferCard {
  name: string;
  value: string;
}

export type SlotVerdict = "ok" | "wrong" | "missing" | "type" | "mismatch";

export const VERDICT_LABEL: Record<SlotVerdict, string> = {
  ok: "HỢP LỆ",
  wrong: "SAI GIÁ TRỊ",
  missing: "KHÔNG CÓ Ô",
  type: "KHÔNG PHẢI CHỮ",
  mismatch: "LỆCH MẪU",
};

/** A memory cell (or, with `device`, a reader screen) of the kiosk. */
export interface Slot {
  name: string;
  label: string;
  device: boolean;
  /** Python preview of the value it holds (null: empty). */
  value: string | null;
  /** Written in this frame. */
  lit: boolean;
  /** Buffer card the value was copied from (identity, not equality); null when typed in or computed. */
  wire: string | null;
  /** Being written when the run broke. */
  noise: boolean;
  verdict?: SlotVerdict;
}

/** An overwritten value peeling off a cell: it flies to the cell holding the same value, or fades (`to` null). */
export interface Ghost {
  id: number;
  value: string;
  from: string;
  to: string | null;
}

export type Drone = "patrol" | "hover" | "locked";

export interface KioskScene {
  wave: "base" | "counter";
  buffer: BufferCard[];
  slots: Slot[];
  ghosts: Ghost[];
  drone: Drone;
  gate: GateState;
  status: string;
  banner: string | null;
  shake: boolean;
}

export interface KioskFrame {
  scene: KioskScene;
  hold: number;
  cues: Cue[];
}

const STEP = 350;
const COUNTER_STEP = 150;
const VERIFY_STEP = 300;
const GHOST_LIFE = 1000;

const devicesOf = (level: LevelDefinition) => {
  const sim = simulationOf(level);
  return sim.kind === "kiosk" ? sim.devices : [];
};

const bufferOf = (level: LevelDefinition, inputs: Record<string, InputValue>): BufferCard[] =>
  level.inputs.map((name) => ({ name, value: formatPyLiteral(inputs[name] ?? "") }));

const emptySlots = (level: LevelDefinition): Slot[] => {
  const devices = devicesOf(level);
  return varObjectives(level).map((o) => ({
    name: o.var,
    label: o.label,
    device: devices.includes(o.var),
    value: null,
    lit: false,
    wire: null,
    noise: false,
  }));
};

/** Scene while Python runs. */
export function runningKioskScene(level: LevelDefinition): KioskScene {
  return {
    wave: "base",
    buffer: bufferOf(level, level.tests[0]?.inputs ?? {}),
    slots: emptySlots(level),
    ghosts: [],
    drone: "patrol",
    gate: "closed",
    status: "ĐANG XỬ LÝ",
    banner: null,
    shake: false,
  };
}

/** Resting scene before the first run. */
export function idleKioskScene(level: LevelDefinition): KioskScene {
  return { ...runningKioskScene(level), status: "CHỜ TÍN HIỆU" };
}

/** Cell being written when the run broke: the name left of `=` on the last traceback line. */
const ASSIGNED = /^\s*([A-Za-z_]\w*)\s*(?::[^=]+)?=(?!=)/;
function brokenSlot(outcome: RunOutcome): string | null {
  const text = outcome.error?.tracebackLines.at(-1)?.text ?? "";
  return ASSIGNED.exec(text)?.[1] ?? null;
}

function verdictOf(v: VarVerdict | undefined, counter: boolean): SlotVerdict {
  if (!v?.present) return "missing";
  if (!v.typeOk) return "type";
  if (!v.valueOk) return counter ? "mismatch" : "wrong";
  return "ok";
}

/** Plays one wave of assignments: one frame per history entry, ghosts living ~1 s. */
class Wave {
  slots: Slot[];
  private ghosts: { ghost: Ghost; born: number }[] = [];
  private elapsed = 0;

  constructor(
    private frames: KioskFrame[],
    private base: KioskScene,
    private nextId: { n: number },
  ) {
    this.slots = base.slots.map((s) => ({ ...s }));
  }

  push(over: Partial<KioskScene>, hold: number, cues: Cue[]) {
    this.ghosts = this.ghosts.filter((g) => this.elapsed - g.born < GHOST_LIFE);
    this.frames.push({ scene: { ...this.base, slots: this.slots.map((s) => ({ ...s })), ghosts: this.ghosts.map((g) => g.ghost), ...over }, hold, cues });
    this.elapsed += hold;
  }

  write(name: string, value: string | null, wire: string | null) {
    const i = this.slots.findIndex((s) => s.name === name);
    if (i < 0) return false;
    const old = this.slots[i].value;
    if (old !== null && old !== value) {
      const to = this.slots.find((s) => s.name !== name && s.value === old)?.name ?? null;
      this.ghosts.push({ ghost: { id: this.nextId.n++, value: old, from: name, to }, born: this.elapsed });
    }
    this.slots = this.slots.map((s, k) => ({ ...s, lit: k === i }));
    this.slots[i] = { ...this.slots[i], value, wire: this.slots[i].device ? null : wire };
    return true;
  }

  unlight() {
    this.slots = this.slots.map((s) => ({ ...s, lit: false }));
  }

  /** History when there is one; otherwise (or after a cut) the final values in objective order. */
  play(history: VarHistoryEntry[] | undefined, truncated: boolean | undefined, vars: VarVerdict[], hold: number, cues: Cue[]) {
    if (history) {
      for (const e of history) {
        if (this.write(e.var, e.preview, e.src)) this.push({ status: e.line === null ? e.var : `dòng ${e.line} · ${e.var}` }, hold, cues);
      }
      if (truncated) {
        for (const v of vars) {
          const s = this.slots.find((x) => x.name === v.name);
          const value = v.present ? v.preview : null;
          if (s && s.value !== value) Object.assign(s, { value, wire: null });
        }
        this.unlight();
        this.push({ status: "LỊCH SỬ BỊ CẮT" }, hold, cues);
      }
    } else {
      for (const v of vars) if (v.present && this.write(v.name, v.preview, null)) this.push({ status: v.name }, hold, cues);
    }
    this.unlight();
  }

  /** Final frame of a broken run: the cell being written turns to noise. */
  broke(outcome: RunOutcome, status: string) {
    const target = brokenSlot(outcome);
    this.slots = this.slots.map((s) => ({ ...s, noise: s.name === target }));
    this.push({ status, ghosts: [] }, 0, ["alarm"]);
  }

  setVerdict(name: string, verdict: SlotVerdict) {
    this.slots = this.slots.map((s) => (s.name === name ? { ...s, verdict } : s));
  }
}

/** Pure description of the kiosk animation for an outcome (GDD 1.2 §8); the component only plays it back. */
export function buildKioskTimeline(outcome: RunOutcome, level: LevelDefinition): KioskFrame[] {
  const start = runningKioskScene(level);
  const frames: KioskFrame[] = [{ scene: start, hold: STEP, cues: [] }];
  const drone: Drone = outcome.alertPercent !== null && outcome.alertPercent > 40 ? "hover" : "patrol";
  const base: KioskScene = { ...start, drone, status: "" };
  const ids = { n: 0 };

  if (outcome.error?.phase === "compile") {
    // The translator refused the code: nothing was written.
    frames.push({ scene: { ...base, status: errorStatus(outcome) }, hold: 0, cues: ["alarm"] });
    return frames;
  }

  const wave = new Wave(frames, base, ids);
  wave.play(outcome.history, outcome.historyTruncated, outcome.vars, STEP, ["terminal_line"]);

  const stopped = !outcome.basePassed && (!!outcome.error || !!outcome.stopStatus || outcome.key === "engine_error");
  if (stopped) {
    wave.broke(outcome, errorStatus(outcome));
    return frames;
  }

  // Check every cell and screen against the profile.
  let firstBad: Slot | undefined;
  for (const v of outcome.vars) {
    const verdict = verdictOf(v, false);
    wave.setVerdict(v.name, verdict);
    if (verdict !== "ok") firstBad ??= wave.slots.find((s) => s.name === v.name);
    wave.push({ status: `${v.name}: ${VERDICT_LABEL[verdict]}` }, VERIFY_STEP, [verdict === "ok" ? "scan_pass" : "scan_reject"]);
  }
  if (!outcome.basePassed) {
    wave.push({ status: firstBad ? `${firstBad.name}: ${VERDICT_LABEL[firstBad.verdict!]}` : "TỪ CHỐI", ghosts: [] }, 0, ["alarm"]);
    return frames;
  }
  if (outcome.sentinelCaught) {
    wave.push({ status: "SENTINEL ĐÃ KHÓA MỤC TIÊU", drone: "locked", ghosts: [] }, 0, ["alarm"]);
    return frames;
  }
  const loud = outcome.stars === 1;
  wave.push({ gate: "half", status: loud ? "TÍN HIỆU BỊ GHI NHẬN" : "CỔNG KHU MỞ MỘT NỬA", ghosts: [] }, outcome.counterVars ? 700 : 0, ["gate_open"]);
  if (!outcome.counterVars) return frames;

  // Counter-attack: OMNI swaps the buffer for a decoy profile and the code runs again.
  const banner = level.counter_attack_banner ?? "CẢNH BÁO: OMNI ĐÃ THAY ĐỔI DỮ LIỆU";
  const cBase: KioskScene = { ...base, wave: "counter", buffer: bufferOf(level, outcome.counterInputs ?? {}), slots: emptySlots(level), gate: "half", banner };
  frames.push({ scene: { ...cBase, shake: true, status: "OMNI PHẢN CÔNG" }, hold: 1200, cues: ["siren"] });
  if (outcome.counterAborted) {
    frames.push({ scene: { ...cBase, status: "CỔNG SẬP VỀ NỬA · TIẾN TRÌNH BỊ CẮT" }, hold: 0, cues: ["alarm"] });
    return frames;
  }

  const cWave = new Wave(frames, cBase, ids);
  cWave.play(outcome.counterHistory, outcome.counterHistoryTruncated, outcome.counterVars, COUNTER_STEP, []);
  if (outcome.error?.phase === "counter" || outcome.key === "timeout") {
    cWave.broke(outcome, `CỔNG SẬP VỀ NỬA · ${errorStatus(outcome)}`);
    return frames;
  }
  for (const v of outcome.counterVars) cWave.setVerdict(v.name, verdictOf(v, true));
  if (outcome.counterSurvived) {
    const gate = gateFor(outcome);
    cWave.push(
      { banner: null, gate, status: gate === "open" ? "CỔNG KHU MỞ HOÀN TOÀN" : "TÍN HIỆU BỊ GHI NHẬN", ghosts: [] },
      0,
      gate === "open" ? ["gate_open", "star"] : ["gate_open"],
    );
    return frames;
  }
  const reason = outcome.key === "counter_type_mismatch" ? "KHÔNG PHẢI CHỮ" : "LỆCH MẪU";
  cWave.push({ status: `CỔNG SẬP VỀ NỬA · ${reason}`, ghosts: [] }, 0, ["alarm"]);
  return frames;
}

/** One sentence for screen readers: "Ki-ốt: 6/6 ô hợp lệ. Cổng khu mở một nửa." */
export function summarizeKiosk(frames: KioskFrame[]): string {
  const last = frames.at(-1)?.scene;
  if (!last) return "";
  const judged = last.slots.filter((s) => s.verdict);
  const head = judged.length
    ? `Ki-ốt: ${judged.filter((s) => s.verdict === "ok").length}/${last.slots.length} ô hợp lệ.`
    : `Ki-ốt: ${last.status}.`;
  const gate = last.gate === "open" ? "mở hoàn toàn" : last.gate === "half" ? "mở một nửa" : "đóng";
  return `${head} Cổng khu ${gate}.`;
}
