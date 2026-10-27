import type { Cue } from "../audio/sound-recipes";
import type { OutputReport, RunOutcome } from "../game/classify-run";
import { outputObjectives, type LevelDefinition } from "../game/level-types";
import { gateFor } from "../game/terminal-lines";
import { emittedSlot, extraSlot, fillUnsent, firstProblem, idleSlots, type OutputSlot } from "./output-slots-model";
import { errorStatus, inputsLabel } from "./scanner-timeline";

/**
 * A line the station sent over the stdin channel. `missing` is the line the program
 * asked for after the last one (EOFError): the slot was empty.
 */
export interface QuestionCard {
  text: string;
  state: "unread" | "read" | "missing";
}

/** The part of an answer row the program wrote as an `input()` prompt, in code points of the line it sent. */
export interface PromptMark {
  /** `OutputSlot.line` of the row (extra rows continue the numbering). */
  line: number;
  start: number;
  end: number;
}

export interface InterrogationScene {
  wave: "base" | "counter";
  questions: QuestionCard[];
  slots: OutputSlot[];
  extra: OutputSlot[];
  /** Index of the answer travelling in this frame: `slots` first, then `extra`. */
  active: number | null;
  /** Card going through the stdin slot in this frame (index into `questions`). */
  feeding: number | null;
  channel: "idle" | "feeding" | "empty";
  station: "closed" | "half" | "open";
  laptop: "idle" | "compile_error";
  promptMarks: PromptMark[];
  status: string;
  banner: string | null;
  chip: string | null;
  sentinel: boolean;
  shake: boolean;
}

export interface InterrogationFrame {
  scene: InterrogationScene;
  hold: number;
  cues: Cue[];
}

const STEP = 450;
const FEED = 350;
export const EMPTY_CHANNEL = "KÊNH NHẬP HẾT DÒNG";

function scene(over: Partial<InterrogationScene> & Pick<InterrogationScene, "slots" | "questions">): InterrogationScene {
  return {
    wave: "base",
    extra: [],
    active: null,
    feeding: null,
    channel: "idle",
    station: "closed",
    laptop: "idle",
    promptMarks: [],
    status: "",
    banner: null,
    chip: null,
    sentinel: false,
    shake: false,
    ...over,
  };
}

const unread = (lines: readonly string[] | undefined): QuestionCard[] => (lines ?? []).map((text) => ({ text, state: "unread" }));

const baseExpected = (level: LevelDefinition) =>
  level.tests[0]?.expected_output ?? outputObjectives(level).map((o) => o.label);

/** Scene while Python runs: the station's questions, none read yet. */
export function interrogationRunningScene(level: LevelDefinition): InterrogationScene {
  return scene({
    slots: idleSlots(baseExpected(level)),
    questions: unread(level.tests[0]?.stdin),
    status: "ĐANG XỬ LÝ",
    chip: inputsLabel(level, level.tests[0]?.inputs ?? {}),
  });
}

/** Resting scene before the first run. */
export function interrogationIdleScene(level: LevelDefinition): InterrogationScene {
  return { ...interrogationRunningScene(level), status: "TRẠM CHỜ TRẢ LỜI" };
}

/** The station's words for a row: it takes or rejects answers; it does not broadcast them. */
function stationSlot(s: OutputSlot): OutputSlot {
  if (s.state === "sent") return { ...s, label: "TRẠM NHẬN" };
  if (s.state === "dropped") return { ...s, label: `TRẠM BÁC · vị trí ${s.diff?.col ?? "?"}` };
  if (s.state === "unsent") return { ...s, label: "CHƯA GỬI" };
  return s;
}

/**
 * Where a prompt the program wrote sits in the rows that went out wrong: the same rule as
 * `output_has_prompt` (NFC, trailing spaces dropped, a prompt the expected line also holds does not count).
 */
export function promptMarksFor(output: OutputReport, prompts: readonly string[] | undefined): PromptMark[] {
  const texts = (prompts ?? []).map((p) => p.normalize("NFC").trimEnd()).filter((p) => p !== "");
  if (texts.length === 0) return [];
  const rows = [
    ...output.lines.filter((l) => l.status === "wrong").map((l) => ({ line: l.line, actual: l.actual ?? "", expected: l.expected })),
    ...output.extraLines.map((text, k) => ({ line: output.lines.length + k + 1, actual: text, expected: "" })),
  ];
  const marks: PromptMark[] = [];
  for (const row of rows) {
    const hit = texts.find((t) => row.actual.includes(t) && !row.expected.includes(t));
    if (!hit) continue;
    const start = Array.from(row.actual.slice(0, row.actual.indexOf(hit))).length;
    marks.push({ line: row.line, start, end: start + Array.from(hit).length });
  }
  return marks;
}

/** Cards slide through the slot one per line the program read; a read past the end leaves the slot empty. */
function feedCards(frames: InterrogationFrame[], base: InterrogationScene, read: number, eof: boolean): QuestionCard[] {
  const questions = base.questions.map((q) => ({ ...q }));
  for (let i = 0; i < Math.min(read, questions.length); i++) {
    questions[i] = { ...questions[i], state: "read" };
    frames.push({
      scene: { ...base, questions: questions.map((q) => ({ ...q })), feeding: i, channel: "feeding", status: `ĐÃ ĐỌC ${i + 1}/${questions.length}` },
      hold: FEED,
      cues: ["terminal_line"],
    });
  }
  if (!eof) return questions;
  questions.push({ text: "", state: "missing" });
  frames.push({ scene: { ...base, questions: questions.map((q) => ({ ...q })), channel: "empty", status: EMPTY_CHANNEL }, hold: STEP, cues: ["scan_reject"] });
  return questions;
}

/** One wave of answers: a frame per line that went out, then one per extra line; lines that never went out filled in last. */
function answerWave(frames: InterrogationFrame[], base: InterrogationScene, output: OutputReport, failed: { label: string } | null) {
  const slots = base.slots.map((s) => ({ ...s }));
  const extra: OutputSlot[] = [];
  const marks = (upTo: number) => base.promptMarks.filter((m) => m.line <= upTo);
  output.lines.forEach((l, i) => {
    if (l.status === "missing") return;
    const ok = l.status === "ok";
    slots[i] = stationSlot(emittedSlot(slots[i], l));
    frames.push({
      scene: { ...base, slots: slots.map((s) => ({ ...s })), active: i, promptMarks: marks(l.line), status: slots[i].label ?? "" },
      hold: STEP,
      cues: [ok ? "scan_pass" : "scan_reject"],
    });
  });
  output.extraLines.forEach((_text, k) => {
    extra.push(extraSlot(output, k));
    frames.push({
      scene: { ...base, slots: slots.map((s) => ({ ...s })), extra: [...extra], active: slots.length + k, promptMarks: marks(slots.length + k + 1), status: "DÒNG THỪA" },
      hold: STEP,
      cues: ["scan_reject"],
    });
  });
  return { slots: fillUnsent(slots, output, failed).map(stationSlot), extra };
}

/** Pure description of the interrogation animation for an outcome; the component only plays it back. */
export function buildInterrogationTimeline(outcome: RunOutcome, level: LevelDefinition): InterrogationFrame[] {
  const start = interrogationRunningScene(level);
  const frames: InterrogationFrame[] = [{ scene: start, hold: STEP, cues: [] }];
  const base = scene({ slots: start.slots, questions: unread(outcome.stdin ?? level.tests[0]?.stdin), chip: start.chip });

  if (outcome.error?.phase === "compile") {
    // Nothing is read, nothing goes out.
    frames.push({ scene: { ...base, laptop: "compile_error", status: "TRÌNH DỊCH TỪ CHỐI" }, hold: 0, cues: ["alarm"] });
    return frames;
  }
  if (!outcome.output) {
    frames.push({ scene: { ...base, status: errorStatus(outcome) }, hold: 0, cues: ["alarm"] });
    return frames;
  }

  const baseError = outcome.error?.phase === "base" ? outcome.error : undefined;
  const baseEof = baseError?.type === "EOFError";
  const questions = feedCards(frames, base, outcome.stdinRead ?? 0, baseEof);
  const stopped = !outcome.basePassed && (!!outcome.error || !!outcome.stopStatus);
  const breakLabel = outcome.error ? `${outcome.error.type} · dòng ${outcome.error.line ?? "?"}` : errorStatus(outcome);
  const answering = { ...base, questions, channel: baseEof ? ("empty" as const) : ("idle" as const), promptMarks: promptMarksFor(outcome.output, outcome.prompts) };
  const wave = answerWave(frames, answering, outcome.output, stopped ? { label: breakLabel } : null);
  const after = { ...answering, slots: wave.slots, extra: wave.extra, promptMarks: answering.promptMarks };

  if (!outcome.basePassed) {
    const bad = firstProblem(wave.slots, wave.extra);
    const status = baseEof ? EMPTY_CHANNEL : stopped ? errorStatus(outcome) : (bad?.label ?? "TRẠM BÁC");
    frames.push({ scene: { ...after, status }, hold: 0, cues: ["alarm"] });
    return frames;
  }
  if (outcome.sentinelCaught) {
    frames.push({ scene: { ...after, status: "SENTINEL ĐÃ KHÓA MỤC TIÊU", sentinel: true }, hold: 0, cues: ["alarm"] });
    return frames;
  }

  const loud = outcome.stars === 1;
  frames.push({
    scene: { ...after, station: "half", status: loud ? "TRẠM DUYỆT, BỊ GHI NHẬN" : "TRẠM DUYỆT MỘT NỬA", sentinel: loud },
    hold: outcome.counterVars ? 700 : 0,
    cues: ["gate_open"],
  });
  if (!outcome.counterVars) return frames;

  // Counter-attack: OMNI swaps the station's questions.
  const banner = level.counter_attack_banner ?? "CẢNH BÁO: OMNI ĐÃ THAY ĐỔI DỮ LIỆU";
  const counterExpected =
    outcome.counterOutput?.lines.map((l) => l.expected) ?? level.counter_attack_tests[0]?.expected_output ?? baseExpected(level);
  const cBase = scene({
    wave: "counter",
    slots: idleSlots(counterExpected),
    questions: unread(outcome.counterStdin ?? level.counter_attack_tests[0]?.stdin),
    station: "half",
    banner,
    chip: inputsLabel(level, outcome.counterInputs ?? {}),
    sentinel: loud,
  });
  frames.push({ scene: { ...cBase, shake: true, status: "OMNI ĐỔI CÂU HỎI" }, hold: 1200, cues: ["siren"] });

  if (outcome.counterAborted || !outcome.counterOutput) {
    frames.push({ scene: { ...cBase, status: "TRẠM VỀ MỘT NỬA · TIẾN TRÌNH BỊ CẮT" }, hold: 0, cues: ["alarm"] });
    return frames;
  }

  const counterError = outcome.error?.phase === "counter";
  const counterEof = counterError && outcome.error?.type === "EOFError";
  const cQuestions = feedCards(frames, cBase, outcome.counterStdinRead ?? 0, counterEof);
  const cAnswering = {
    ...cBase,
    questions: cQuestions,
    channel: counterEof ? ("empty" as const) : ("idle" as const),
    promptMarks: promptMarksFor(outcome.counterOutput, outcome.counterPrompts),
  };
  const cWave = answerWave(frames, cAnswering, outcome.counterOutput, counterError || outcome.key === "timeout" ? { label: breakLabel } : null);
  const cAfter = { ...cAnswering, slots: cWave.slots, extra: cWave.extra };
  const gate = gateFor(outcome);

  if (outcome.counterSurvived) {
    frames.push({
      scene: { ...cAfter, banner: null, station: gate === "open" ? "open" : "half", status: gate === "open" ? "TRẠM DUYỆT HOÀN TOÀN" : "TRẠM DUYỆT, BỊ GHI NHẬN" },
      hold: 0,
      cues: gate === "open" ? ["gate_open", "star"] : ["gate_open"],
    });
    return frames;
  }
  const bad = firstProblem(cWave.slots, cWave.extra);
  const reason = counterEof
    ? EMPTY_CHANNEL
    : counterError
      ? `${outcome.error?.type ?? "LỖI"}: dòng ${outcome.error?.line ?? "?"}`
      : outcome.key === "timeout"
        ? "TIẾN TRÌNH BỊ CẮT"
        : (bad?.label ?? "LỆCH MẪU");
  frames.push({ scene: { ...cAfter, status: `TRẠM VỀ MỘT NỬA · ${reason}` }, hold: 0, cues: ["alarm"] });
  return frames;
}

/** One sentence for screen readers: "Trạm gửi 2 dòng, chương trình đọc 1. Trạm nhận 0/3 dòng. …" */
export function summarizeInterrogation(frames: InterrogationFrame[]): string {
  const last = frames.at(-1)?.scene;
  if (!last) return "";
  const sent = last.questions.filter((q) => q.state !== "missing");
  const read = sent.filter((q) => q.state === "read").length;
  const taken = last.slots.filter((s) => s.state === "sent").length;
  const parts = [`Trạm gửi ${sent.length} dòng, chương trình đọc ${read}.`];
  if (last.channel === "empty") parts.push("Chương trình đòi thêm một dòng: kênh nhập hết dòng.");
  parts.push(`Trạm nhận ${taken}/${last.slots.length} dòng trả lời.`);
  const bad = firstProblem(last.slots, last.extra);
  if (last.laptop === "compile_error") parts.push("Trình dịch từ chối.");
  else if (bad?.state === "dropped") parts.push(`Dòng ${bad.line} sai ở vị trí ${bad.diff?.col ?? "?"}.`);
  else if (bad?.state === "missing") parts.push(`Thiếu từ dòng ${bad.line}.`);
  else if (bad?.state === "error") parts.push(`Lỗi ${bad.label}.`);
  else if (bad?.state === "extra") parts.push("Có dòng thừa.");
  if (last.promptMarks.length > 0) parts.push("Lời nhắc của chương trình lẫn vào câu trả lời.");
  parts.push(last.station === "open" ? "Trạm duyệt hoàn toàn." : last.station === "half" ? "Trạm duyệt một nửa." : "Trạm chưa duyệt.");
  return parts.join(" ");
}
