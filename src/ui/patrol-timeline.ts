import type { Cue } from "../audio/sound-recipes";
import type { OutputReport, RoundVerdict, RunOutcome, VarVerdict } from "../game/classify-run";
import { simulationOf, varObjectives, type InputValue, type LevelDefinition, type PatrolDecision } from "../game/level-types";
import { visible } from "../game/output-diff";
import { formatPyLiteral } from "../game/python-literal";
import { gateFor, type GateState } from "../game/terminal-lines";
import { idleSlots, settledSlots, type OutputSlot } from "./output-slots-model";
import { errorStatus } from "./scanner-timeline";

/** One situation per base test, played one after another. */
export type SituationState = "idle" | "active" | "passed" | "caught" | "notReached";

/** A card on the sensor board: an input chip or one stdin line. */
export interface SensorCard {
  kind: "input" | "stdin";
  name: string;
  /** As shown: a Python literal for inputs; the line with spaces made visible (`·`) for stdin. */
  text: string;
  /** An empty stdin line: drawn as an empty, labelled card, never hidden. */
  empty: boolean;
}

/** Kai's move: the value the `decision` objective got. */
export interface DecisionChip {
  label: string;
  /** null: nothing (the variable does not exist, the line was never printed). */
  value: string | null;
  state: "idle" | "ok" | "bad";
}

/** A variable objective drawn as a drone lamp. */
export interface PatrolLamp {
  name: string;
  label: string;
  value: string | null;
  state: "idle" | "ok" | "bad";
}

export type KaiState = "waiting" | "through" | "caught" | "still";
export type DroneState = "sweep" | "locked" | "passed" | "idle";

export interface PatrolScene {
  wave: "base" | "counter";
  situations: SituationState[];
  /** 1-based situation on screen (base wave only). */
  round: number | null;
  sensors: SensorCard[];
  decision: DecisionChip | null;
  lamps: PatrolLamp[];
  /** Output lines other than the decision line. */
  slots: OutputSlot[];
  extra: OutputSlot[];
  kai: KaiState;
  drone: DroneState;
  gate: GateState;
  /** Big label over the strip: "BỊ PHÁT HIỆN", "DRONE BỎ QUA", "TIẾN TRÌNH BỊ CẮT"… */
  label: string | null;
  status: string;
  banner: string | null;
  sentinel: boolean;
  compileError: boolean;
}

export interface PatrolFrame {
  scene: PatrolScene;
  hold: number;
  cues: Cue[];
}

const STEP = 500;
const COUNTER_BANNER = "OMNI ĐỔI LUẬT TUẦN TRA";
export const CUT = "TIẾN TRÌNH BỊ CẮT";

const decisionOf = (level: LevelDefinition): PatrolDecision | undefined => {
  const sim = simulationOf(level);
  return sim.kind === "patrol" ? sim.decision : undefined;
};

const decisionLabel = (level: LevelDefinition, d: PatrolDecision | undefined): string | null => {
  if (!d) return null;
  const o = level.objectives.find((x) => ("line" in d ? x.kind === "output_line" && x.line === d.line : x.kind !== "output_line" && x.var === d.var));
  return o?.label ?? null;
};

export function sensorCards(level: LevelDefinition, inputs: Record<string, InputValue> | undefined, stdin: string[] | undefined): SensorCard[] {
  const cards: SensorCard[] = level.inputs.map((name) => ({
    kind: "input",
    name,
    text: inputs && name in inputs ? formatPyLiteral(inputs[name]) : "?",
    empty: false,
  }));
  (stdin ?? []).forEach((line, i) =>
    cards.push({ kind: "stdin", name: `kênh nhập ${i + 1}`, text: line === "" ? "(dòng trống)" : visible(line), empty: line === "" }),
  );
  return cards;
}

const lampsOf = (level: LevelDefinition, decision: PatrolDecision | undefined, vars: VarVerdict[] | undefined, graded: boolean): PatrolLamp[] =>
  varObjectives(level)
    .filter((o) => !(decision && "var" in decision && decision.var === o.var))
    .map((o) => {
      const v = vars?.find((x) => x.name === o.var);
      const ok = !!v && v.present && v.typeOk && v.valueOk;
      return { name: o.var, label: o.label, value: graded ? (v?.preview ?? null) : null, state: graded ? (ok ? "ok" : "bad") : "idle" };
    });

function chipOf(level: LevelDefinition, d: PatrolDecision | undefined, vars: VarVerdict[] | undefined, output: OutputReport | undefined, graded: boolean): DecisionChip | null {
  const label = decisionLabel(level, d);
  if (!d || label === null) return null;
  if (!graded) return { label, value: null, state: "idle" };
  if ("line" in d) {
    const l = output?.lines.find((x) => x.line === d.line);
    return { label, value: l?.actual ?? null, state: l?.status === "ok" ? "ok" : "bad" };
  }
  const v = vars?.find((x) => x.name === d.var);
  return { label, value: v?.present ? v.preview : null, state: v && v.present && v.typeOk && v.valueOk ? "ok" : "bad" };
}

function slotsOf(d: PatrolDecision | undefined, output: OutputReport | undefined, expected: string[], failed: { label: string } | null) {
  const keep = (s: OutputSlot) => !(d && "line" in d && s.line === d.line);
  if (!output) return { slots: idleSlots(expected).filter(keep), extra: [] as OutputSlot[] };
  const settled = settledSlots(output, failed);
  return { slots: settled.slots.filter(keep), extra: settled.extra };
}

function scene(level: LevelDefinition, over: Partial<PatrolScene>): PatrolScene {
  const d = decisionOf(level);
  const t = level.tests[0];
  return {
    wave: "base",
    situations: level.tests.map(() => "idle"),
    round: null,
    sensors: sensorCards(level, t?.inputs, t?.stdin),
    decision: chipOf(level, d, undefined, undefined, false),
    lamps: lampsOf(level, d, undefined, false),
    ...slotsOf(d, undefined, t?.expected_output ?? [], null),
    kai: "waiting",
    drone: "sweep",
    gate: "closed",
    label: null,
    status: "",
    banner: null,
    sentinel: false,
    compileError: false,
    ...over,
  };
}

/** Scene while Python runs. */
export const patrolRunningScene = (level: LevelDefinition): PatrolScene => scene(level, { status: "DRONE ĐANG QUÉT" });

/** Resting scene before the first run. */
export const patrolIdleScene = (level: LevelDefinition): PatrolScene => scene(level, { status: "CHỜ LỆNH", drone: "idle" });

const copy = (s: PatrolScene): PatrolScene => ({ ...s, situations: [...s.situations] });

interface SituationData {
  inputs?: Record<string, InputValue>;
  stdin?: string[];
  expected: string[];
  /** Absent while the sensors are read, before Kai moves. */
  result?: { vars?: VarVerdict[]; output?: OutputReport };
}

/** One situation on screen: the sensor board, then (with `result`) Kai's move and the lamps. */
function situation(level: LevelDefinition, base: PatrolScene, r: SituationData, failed: { label: string } | null = null): PatrolScene {
  const d = decisionOf(level);
  const shown = r.result !== undefined;
  return {
    ...copy(base),
    sensors: sensorCards(level, r.inputs, r.stdin),
    decision: chipOf(level, d, r.result?.vars, r.result?.output, shown),
    lamps: lampsOf(level, d, r.result?.vars, shown),
    ...slotsOf(d, r.result?.output, r.expected, failed),
  };
}

/** Pure description of the patrol animation for an outcome; the component only plays it back. */
export function buildPatrolTimeline(outcome: RunOutcome, level: LevelDefinition): PatrolFrame[] {
  const start = patrolRunningScene(level);
  const frames: PatrolFrame[] = [{ scene: start, hold: STEP, cues: [] }];
  const rest = { ...copy(start), status: "" };

  if (outcome.error?.phase === "compile") {
    // No situation runs: the drone never saw a move.
    frames.push({ scene: { ...rest, compileError: true, drone: "idle", label: "TRÌNH DỊCH TỪ CHỐI", status: "TRÌNH DỊCH TỪ CHỐI" }, hold: 0, cues: ["alarm"] });
    return frames;
  }
  // Every patrol level has two or more base tests, so a run that reported anything has rounds.
  const rounds: RoundVerdict[] = outcome.rounds ?? [];
  if (rounds.length === 0) {
    // Engine error or a run cut off before any report.
    frames.push({ scene: { ...rest, drone: "idle", label: CUT, status: errorStatus(outcome) }, hold: 0, cues: ["alarm"] });
    return frames;
  }

  const stopped = !outcome.basePassed && (!!outcome.error || !!outcome.stopStatus);
  const breakLabel = outcome.error ? `${outcome.error.type} · dòng ${outcome.error.line ?? "?"}` : errorStatus(outcome);
  let s = copy(rest);
  for (const r of rounds) {
    const n = r.index + 1;
    const expected = level.tests[r.index]?.expected_output ?? [];
    s.situations[r.index] = "active";
    const data: SituationData = { inputs: r.inputs, stdin: r.stdin, expected };
    s = { ...situation(level, s, data), round: n, kai: "waiting", drone: "sweep", label: null, status: `TÌNH HUỐNG ${n}/${s.situations.length}` };
    frames.push({ scene: copy(s), hold: STEP, cues: [] });
    const failedHere = !r.passed && stopped;
    s = situation(level, s, { ...data, result: { vars: r.vars, output: r.output } }, failedHere ? { label: breakLabel } : null);
    if (r.passed) {
      s.situations[r.index] = "passed";
      s = { ...s, kai: "through", drone: "passed", label: "DRONE BỎ QUA" };
      frames.push({ scene: copy(s), hold: 700, cues: ["scan_pass"] });
      continue;
    }
    // The first situation the drone catches stops the crossing: later ones never happen on screen.
    s.situations = s.situations.map((st, i) => (i === r.index ? "caught" : i > r.index ? "notReached" : st));
    const still = !!s.decision && s.decision.value === null;
    frames.push({
      scene: { ...copy(s), kai: still ? "still" : "caught", drone: "locked", label: failedHere ? breakLabel : "BỊ PHÁT HIỆN", status: failedHere ? errorStatus(outcome) : "DRONE PHÁT HIỆN" },
      hold: 0,
      cues: ["alarm"],
    });
    return frames;
  }
  if (!outcome.basePassed) {
    frames.push({ scene: { ...copy(s), drone: "locked", label: "BỊ PHÁT HIỆN", status: errorStatus(outcome) }, hold: 0, cues: ["alarm"] });
    return frames;
  }

  if (outcome.sentinelCaught) {
    frames.push({ scene: { ...copy(s), round: null, kai: "caught", drone: "locked", label: "SENTINEL ĐÃ KHÓA MỤC TIÊU", status: "SENTINEL ĐÃ KHÓA MỤC TIÊU", sentinel: true }, hold: 0, cues: ["alarm"] });
    return frames;
  }
  const loud = outcome.stars === 1;
  const hasCounter = level.counter_attack_tests.length > 0;
  frames.push({
    scene: { ...copy(s), round: null, gate: "half", label: loud ? "TÍN HIỆU BỊ GHI NHẬN" : "QUA DẢI TUẦN TRA", status: `${s.situations.length} TÌNH HUỐNG ĐỀU QUA`, sentinel: loud },
    hold: hasCounter ? 700 : 0,
    cues: ["gate_open"],
  });
  if (!hasCounter) return frames;

  // OMNI changes the patrol rules: the counter-attack test is one more situation.
  const counterData: SituationData = {
    inputs: outcome.counterInputs,
    stdin: outcome.counterStdin,
    expected: level.counter_attack_tests[0]?.expected_output ?? [],
  };
  const c: PatrolScene = {
    ...situation(level, s, counterData),
    wave: "counter",
    round: null,
    kai: "waiting",
    drone: "sweep",
    gate: "half",
    label: null,
    banner: level.counter_attack_banner ?? COUNTER_BANNER,
    sentinel: loud,
  };
  frames.push({ scene: { ...copy(c), status: COUNTER_BANNER }, hold: 1200, cues: ["siren"] });

  const hasOutput = level.objectives.some((o) => o.kind === "output_line");
  const cut =
    outcome.key === "timeout" || !!outcome.counterAborted || outcome.error?.phase === "counter" || !outcome.counterVars || (hasOutput && !outcome.counterOutput);
  if (cut) {
    const why =
      outcome.counterAborted === "engine_error"
        ? "LÕI PYTHON KHÔNG PHẢN HỒI"
        : outcome.error?.phase === "counter"
          ? `${outcome.error.type}: dòng ${outcome.error.line ?? "?"}`
          : CUT;
    // The run was cut short: no verdict from the drone, the strip stays half open.
    frames.push({ scene: { ...copy(c), kai: "still", drone: "idle", label: CUT, status: `LỐI QUA GIỮ MỘT NỬA · ${why}` }, hold: 0, cues: ["alarm"] });
    return frames;
  }
  const after = situation(level, c, { ...counterData, result: { vars: outcome.counterVars, output: outcome.counterOutput } });
  const gate = gateFor(outcome);
  if (outcome.counterSurvived) {
    frames.push({
      scene: { ...after, banner: null, gate, kai: "through", drone: "passed", label: "DRONE BỎ QUA", status: gate === "open" ? "LỐI QUA MỞ HOÀN TOÀN" : "TÍN HIỆU BỊ GHI NHẬN" },
      hold: 0,
      cues: gate === "open" ? ["gate_open", "star"] : ["gate_open"],
    });
    return frames;
  }
  const still = !!after.decision && after.decision.value === null;
  frames.push({
    scene: { ...after, kai: still ? "still" : "caught", drone: "locked", label: "BỊ PHÁT HIỆN", status: "LỐI QUA GIỮ MỘT NỬA · DRONE PHÁT HIỆN" },
    hold: 0,
    cues: ["alarm"],
  });
  return frames;
}

/** One sentence for screen readers: "Tình huống 1 qua. Tình huống 2: bị phát hiện." */
export function summarizePatrol(frames: PatrolFrame[]): string {
  const last = frames.at(-1)?.scene;
  if (!last) return "";
  if (last.compileError) return "Trình dịch từ chối. Không tình huống nào chạy.";
  const parts: string[] = [];
  last.situations.forEach((st, i) => {
    if (st === "passed") parts.push(`Tình huống ${i + 1} qua.`);
    else if (st === "caught") parts.push(`Tình huống ${i + 1}: bị phát hiện.`);
  });
  if (parts.length === 0) parts.push("Không tình huống nào chạy xong.");
  if (last.wave === "counter")
    parts.push(last.label === CUT ? "OMNI đổi luật: tiến trình bị cắt." : last.label === "DRONE BỎ QUA" ? "OMNI đổi luật: drone vẫn bỏ qua." : "OMNI đổi luật: bị phát hiện.");
  parts.push(last.gate === "open" ? "Lối qua mở hoàn toàn." : last.gate === "half" ? "Lối qua mở một nửa." : "Lối qua đóng.");
  return parts.join(" ");
}
