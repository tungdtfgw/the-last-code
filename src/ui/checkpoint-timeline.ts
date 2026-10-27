import type { Cue } from "../audio/sound-recipes";
import type { OutputReport, RunOutcome } from "../game/classify-run";
import { outputObjectives, type InputValue, type LevelDefinition } from "../game/level-types";
import { formatPyLiteral } from "../game/python-literal";
import { gateFor, type GateState } from "../game/terminal-lines";
import { emittedSlot, extraSlot, fillUnsent, firstProblem, idleSlots, type OutputSlot } from "./output-slots-model";
import { errorStatus, inputsLabel } from "./scanner-timeline";

/** One scan ring per base test, drawn as consecutive rounds. */
export type RingState = "idle" | "scanning" | "locked" | "rejected" | "notReached";
/** One Neural-ID cell per output line: lit when the line passed, red when it did not, white once the hand check passed. */
export type CellState = "idle" | "lit" | "red" | "white";

export interface CheckpointScene {
  wave: "base" | "counter";
  rings: RingState[];
  /** 1-based round on screen (base wave only). */
  round: number | null;
  /** Session data and stdin lines of the round on screen. */
  chip: string | null;
  stdinChip: string | null;
  idBar: CellState[];
  slots: OutputSlot[];
  extra: OutputSlot[];
  /** Index of the line travelling in this frame: `slots` first, then `extra`. */
  active: number | null;
  booth: "dark" | "lit";
  gate: GateState;
  /** Big label on the gate: "BÁC Ở VÒNG 2", "CỔNG MỞ MỘT NỬA"… */
  label: string | null;
  status: string;
  banner: string | null;
  sentinel: boolean;
  compileError: boolean;
  /** First wrong line of the rejected round, kept for the screen-reader summary. */
  rejectedLine: number | null;
}

export interface CheckpointFrame {
  scene: CheckpointScene;
  hold: number;
  cues: Cue[];
}

const STEP = 450;

export const stdinLabel = (stdin: string[] | undefined) =>
  stdin ? `kênh nhập: ${stdin.length ? stdin.map((s) => formatPyLiteral(s)).join(", ") : "(trống)"}` : null;

const roundCount = (level: LevelDefinition) => Math.max(1, level.tests.length);
const expectedOf = (level: LevelDefinition, index: number) =>
  level.tests[index]?.expected_output ?? outputObjectives(level).map((o) => o.label);
const chipOf = (level: LevelDefinition, inputs: Record<string, InputValue> | undefined) => (inputs ? inputsLabel(level, inputs) : null);

function scene(level: LevelDefinition, over: Partial<CheckpointScene>): CheckpointScene {
  const expected = expectedOf(level, 0);
  return {
    wave: "base",
    rings: Array.from({ length: roundCount(level) }, () => "idle"),
    round: null,
    chip: chipOf(level, level.tests[0]?.inputs),
    stdinChip: stdinLabel(level.tests[0]?.stdin),
    idBar: expected.map(() => "idle"),
    slots: idleSlots(expected),
    extra: [],
    active: null,
    booth: "dark",
    gate: "closed",
    label: null,
    status: "",
    banner: null,
    sentinel: false,
    compileError: false,
    rejectedLine: null,
    ...over,
  };
}

/** Scene while Python runs. */
export function checkpointRunningScene(level: LevelDefinition): CheckpointScene {
  return scene(level, { status: "ĐANG QUÉT" });
}

/** Resting scene before the first run. */
export function checkpointIdleScene(level: LevelDefinition): CheckpointScene {
  return scene(level, { status: "CHỜ TÍN HIỆU" });
}

const copy = (s: CheckpointScene): CheckpointScene => ({
  ...s,
  rings: [...s.rings],
  idBar: [...s.idBar],
  slots: s.slots.map((x) => ({ ...x })),
  extra: s.extra.map((x) => ({ ...x })),
});

/** Lines never sent leave their cell dark. */
const cellOf = (slot: OutputSlot): CellState => (slot.state === "sent" ? "lit" : slot.state === "idle" || slot.state === "unsent" ? "idle" : "red");

/**
 * The six lines of one pass through the gate, a 450 ms frame per line that went out,
 * then one per extra line. Returns the scene after the lines that never went out are filled in.
 */
function playLines(frames: CheckpointFrame[], start: CheckpointScene, output: OutputReport, failed: { label: string } | null): CheckpointScene {
  const s = copy(start);
  output.lines.forEach((l, i) => {
    if (l.status === "missing" || !s.slots[i]) return;
    s.slots[i] = emittedSlot(s.slots[i], l);
    s.idBar[i] = cellOf(s.slots[i]);
    frames.push({ scene: { ...copy(s), active: i, status: s.slots[i].label ?? "" }, hold: STEP, cues: [l.status === "ok" ? "scan_pass" : "scan_reject"] });
  });
  output.extraLines.forEach((_text, k) => {
    s.extra.push(extraSlot(output, k));
    frames.push({ scene: { ...copy(s), active: s.slots.length + k, status: "DÒNG THỪA" }, hold: STEP, cues: ["scan_reject"] });
  });
  s.slots = fillUnsent(s.slots, output, failed);
  s.idBar = s.slots.map(cellOf);
  return s;
}

/** Pure description of the checkpoint animation for an outcome; the component only plays it back. */
export function buildCheckpointTimeline(outcome: RunOutcome, level: LevelDefinition): CheckpointFrame[] {
  const start = checkpointRunningScene(level);
  const frames: CheckpointFrame[] = [{ scene: start, hold: STEP, cues: [] }];
  const rest = { ...start, status: "" };

  if (outcome.error?.phase === "compile") {
    // No ring lights up: the gate never received anything.
    frames.push({ scene: { ...rest, compileError: true, status: "TRÌNH DỊCH TỪ CHỐI" }, hold: 0, cues: ["alarm"] });
    return frames;
  }
  const rounds = outcome.rounds ?? (outcome.output ? [{ index: 0, passed: outcome.basePassed, inputs: level.tests[0]?.inputs ?? {}, stdin: outcome.stdin, output: outcome.output, vars: [] }] : []);
  if (rounds.length === 0) {
    // Engine error or a run cut off before any report.
    frames.push({ scene: { ...rest, status: errorStatus(outcome) }, hold: 0, cues: ["alarm"] });
    return frames;
  }

  const stopped = !outcome.basePassed && (!!outcome.error || !!outcome.stopStatus);
  const breakLabel = outcome.error ? `${outcome.error.type} · dòng ${outcome.error.line ?? "?"}` : errorStatus(outcome);
  let s = copy(rest);
  for (const r of rounds) {
    const n = r.index + 1;
    const expected = r.output?.lines.map((l) => l.expected) ?? expectedOf(level, r.index);
    s.rings[r.index] = "scanning";
    s = {
      ...s,
      round: n,
      chip: chipOf(level, r.inputs),
      stdinChip: stdinLabel(r.stdin),
      slots: idleSlots(expected),
      extra: [],
      idBar: expected.map(() => "idle"),
      status: `VÒNG QUÉT ${n}/${s.rings.length}`,
    };
    frames.push({ scene: copy(s), hold: STEP, cues: [] });
    if (!r.output) break;
    s = playLines(frames, s, r.output, !r.passed && stopped ? { label: breakLabel } : null);
    if (r.passed) {
      s.rings[r.index] = "locked";
      frames.push({ scene: { ...copy(s), status: `VÒNG ${n} ĐẠT` }, hold: 600, cues: ["objective_lock"] });
      continue;
    }
    // The first rejected round stops the pass: later rounds never happen on screen.
    s.rings = s.rings.map((ring, i) => (i === r.index ? "rejected" : i > r.index ? "notReached" : ring));
    const bad = firstProblem(s.slots, s.extra);
    frames.push({
      scene: { ...copy(s), label: `BÁC Ở VÒNG ${n}`, rejectedLine: bad?.line ?? null, status: stopped ? errorStatus(outcome) : (bad?.label ?? "CỔNG BÁC") },
      hold: 0,
      cues: ["alarm"],
    });
    return frames;
  }
  if (!outcome.basePassed) {
    // A failed run without a rejected round (no report for it): the gate stays shut.
    frames.push({ scene: { ...copy(s), status: errorStatus(outcome) }, hold: 0, cues: ["alarm"] });
    return frames;
  }

  if (outcome.sentinelCaught) {
    frames.push({ scene: { ...copy(s), round: null, status: "SENTINEL ĐÃ KHÓA MỤC TIÊU", sentinel: true }, hold: 0, cues: ["alarm"] });
    return frames;
  }
  const loud = outcome.stars === 1;
  frames.push({
    scene: { ...copy(s), round: null, gate: "half", label: loud ? "TÍN HIỆU BỊ GHI NHẬN" : "CỔNG MỞ MỘT NỬA", status: "BA VÒNG ĐẠT", sentinel: loud },
    hold: outcome.counterVars ? 700 : 0,
    cues: ["gate_open"],
  });
  if (!outcome.counterVars) return frames;

  // Hand check: the night guard runs the six lines again on data of her own.
  const counterExpected =
    outcome.counterOutput?.lines.map((l) => l.expected) ?? level.counter_attack_tests[0]?.expected_output ?? expectedOf(level, 0);
  const c: CheckpointScene = {
    ...copy(s),
    wave: "counter",
    round: null,
    chip: chipOf(level, outcome.counterInputs),
    stdinChip: stdinLabel(outcome.counterStdin),
    slots: idleSlots(counterExpected),
    extra: [],
    idBar: counterExpected.map(() => "idle"),
    booth: "lit",
    gate: "half",
    label: null,
    banner: level.counter_attack_banner ?? "KIỂM TAY",
    sentinel: loud,
  };
  frames.push({ scene: { ...copy(c), status: "KIỂM TAY" }, hold: 1200, cues: ["siren"] });

  if (outcome.counterAborted || !outcome.counterOutput) {
    frames.push({ scene: { ...copy(c), status: "CỔNG GIỮ MỘT NỬA · TIẾN TRÌNH BỊ CẮT" }, hold: 0, cues: ["alarm"] });
    return frames;
  }
  const counterError = outcome.error?.phase === "counter";
  const after = playLines(frames, c, outcome.counterOutput, counterError || outcome.key === "timeout" ? { label: breakLabel } : null);
  const gate = gateFor(outcome);
  if (outcome.counterSurvived) {
    const open = gate === "open";
    frames.push({
      scene: {
        ...copy(after),
        banner: null,
        gate,
        idBar: open ? after.idBar.map(() => "white") : after.idBar,
        label: open ? "CỔNG MỞ HOÀN TOÀN" : "TÍN HIỆU BỊ GHI NHẬN",
        status: "KIỂM TAY ĐẠT",
      },
      hold: 0,
      cues: open ? ["gate_open", "star"] : ["gate_open"],
    });
    return frames;
  }
  const bad = firstProblem(after.slots, after.extra);
  const reason = counterError
    ? `${outcome.error?.type ?? "LỖI"}: dòng ${outcome.error?.line ?? "?"}`
    : outcome.key === "timeout"
      ? "TIẾN TRÌNH BỊ CẮT"
      : (bad?.label ?? "LỆCH MẪU");
  frames.push({
    scene: { ...copy(after), label: "KIỂM TAY BÁC", rejectedLine: bad?.line ?? null, status: `CỔNG GIỮ MỘT NỬA · ${reason}` },
    hold: 0,
    cues: ["alarm"],
  });
  return frames;
}

/** One sentence for screen readers: "Vòng 1 đạt. Vòng 2 bác ở dòng 3. Cổng đóng." */
export function summarizeCheckpoint(frames: CheckpointFrame[]): string {
  const last = frames.at(-1)?.scene;
  if (!last) return "";
  if (last.compileError) return "Trình dịch từ chối. Cổng đóng.";
  const parts: string[] = [];
  const baseEnd = [...frames].reverse().find((f) => f.scene.wave === "base")!.scene;
  last.rings.forEach((ring, i) => {
    if (ring === "locked") parts.push(`Vòng ${i + 1} đạt.`);
    else if (ring === "rejected") parts.push(`Vòng ${i + 1} bác${baseEnd.rejectedLine ? ` ở dòng ${baseEnd.rejectedLine}` : ""}.`);
  });
  if (parts.length === 0) parts.push("Không vòng nào chạy xong.");
  if (last.wave === "counter") parts.push(last.label === "KIỂM TAY BÁC" ? `Kiểm tay bác${last.rejectedLine ? ` ở dòng ${last.rejectedLine}` : ""}.` : last.status === "KIỂM TAY ĐẠT" ? "Kiểm tay đạt." : "Kiểm tay bị cắt.");
  parts.push(last.gate === "open" ? "Cổng mở hoàn toàn." : last.gate === "half" ? "Cổng mở một nửa." : "Cổng đóng.");
  return parts.join(" ");
}
