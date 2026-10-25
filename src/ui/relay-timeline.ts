import type { Cue } from "../audio/sound-recipes";
import type { OutputReport, RunOutcome } from "../game/classify-run";
import { outputObjectives, simulationOf, type LevelDefinition } from "../game/level-types";
import { describeLine, type LineDiff } from "../game/output-diff";
import { gateFor, type GateState } from "../game/terminal-lines";
import { errorStatus, inputsLabel } from "./scanner-timeline";

export type SlotState = "idle" | "sent" | "dropped" | "missing" | "unsent" | "error" | "extra";

/** One row of the broadcast list: an expected line (or an extra one) and what became of it. */
export interface RelaySlot {
  line: number;
  expected: string;
  state: SlotState;
  diff?: LineDiff;
  label?: string;
}

export interface RelayScene {
  wave: "base" | "counter";
  slots: RelaySlot[];
  extra: RelaySlot[];
  /** Index of the packet travelling in this frame: `slots` first, then `extra`. */
  active: number | null;
  antenna: "idle" | "flash" | "off";
  channel: GateState;
  laptop: "idle" | "compile_error";
  /** Waves that went into the blind network so far in this wave. */
  wavesLit: number;
  /** The beam reached the edge of the grid (counter-attack survived). */
  reachedEdge: boolean;
  status: string;
  banner: string | null;
  chip: string | null;
  sentinel: boolean;
  shake: boolean;
}

export interface RelayFrame {
  scene: RelayScene;
  hold: number;
  cues: Cue[];
}

const STEP = 450;

export const stationOf = (level: LevelDefinition) => {
  const sim = simulationOf(level);
  return sim.kind === "relay" ? sim.station : "";
};

const idleSlots = (expected: string[]): RelaySlot[] => expected.map((e, i) => ({ line: i + 1, expected: e, state: "idle" }));

function scene(over: Partial<RelayScene> & Pick<RelayScene, "slots">): RelayScene {
  return {
    wave: "base",
    extra: [],
    active: null,
    antenna: "idle",
    channel: "closed",
    laptop: "idle",
    wavesLit: 0,
    reachedEdge: false,
    status: "",
    banner: null,
    chip: null,
    sentinel: false,
    shake: false,
    ...over,
  };
}

const baseExpected = (level: LevelDefinition) =>
  level.tests[0]?.expected_output ?? outputObjectives(level).map((o) => o.label);

/** Scene while Python runs. */
export function relayRunningScene(level: LevelDefinition): RelayScene {
  return scene({ slots: idleSlots(baseExpected(level)), status: "ĐANG XỬ LÝ", chip: inputsLabel(level, level.tests[0]?.inputs ?? {}) });
}

/** Resting scene before the first run. */
export function relayIdleScene(level: LevelDefinition): RelayScene {
  return { ...relayRunningScene(level), status: "CHỜ TÍN HIỆU" };
}

const slotLabel = (s: RelaySlot) => s.label ?? "";

/**
 * One wave of packets: a 450 ms frame per line that went out (sent or dropped),
 * then one per extra line. Lines that never went out are filled in by `finish`.
 * `failed`: the program stopped, so the first line missing is where it broke.
 */
function playWave(
  frames: RelayFrame[],
  base: RelayScene,
  output: OutputReport,
  failed: { label: string } | null,
): { slots: RelaySlot[]; extra: RelaySlot[]; lit: number } {
  const slots = base.slots.map((s) => ({ ...s }));
  const extra: RelaySlot[] = [];
  let lit = 0;
  output.lines.forEach((l, i) => {
    if (l.status === "missing") return;
    const ok = l.status === "ok";
    const diff = ok ? undefined : describeLine(l);
    slots[i] = { ...slots[i], expected: l.expected, state: ok ? "sent" : "dropped", diff, label: ok ? "ĐÃ PHÁT" : `BỎ GÓI · vị trí ${diff!.col}` };
    if (ok) lit++;
    frames.push({
      scene: { ...base, slots: slots.map((s) => ({ ...s })), active: i, antenna: ok ? "flash" : "idle", wavesLit: lit, status: slotLabel(slots[i]) },
      hold: STEP,
      cues: [ok ? "scan_pass" : "scan_reject"],
    });
  });
  output.extraLines.forEach((text, k) => {
    const more = k === output.extraLines.length - 1 ? output.extraCount - output.extraLines.length : 0;
    extra.push({ line: output.lines.length + k + 1, expected: text, state: "extra", label: more > 0 ? `DÒNG THỪA · +${more}` : "DÒNG THỪA" });
    frames.push({
      scene: { ...base, slots: slots.map((s) => ({ ...s })), extra: [...extra], active: slots.length + k, wavesLit: lit, status: "DÒNG THỪA" },
      hold: STEP,
      cues: ["scan_reject"],
    });
  });
  // Lines that never went out.
  let broke = false;
  output.lines.forEach((l, i) => {
    if (l.status !== "missing") return;
    if (failed && !broke) {
      slots[i] = { ...slots[i], expected: l.expected, state: "error", label: failed.label };
      broke = true;
    } else {
      slots[i] = { ...slots[i], expected: l.expected, state: failed ? "unsent" : "missing", label: failed ? "CHƯA PHÁT" : "KHÔNG CÓ DÒNG" };
    }
  });
  return { slots, extra, lit };
}

const firstProblem = (slots: RelaySlot[], extra: RelaySlot[]) =>
  slots.find((s) => s.state !== "sent" && s.state !== "idle") ?? extra[0];

/** Pure description of the relay animation for an outcome; the component only plays it back. */
export function buildRelayTimeline(outcome: RunOutcome, level: LevelDefinition): RelayFrame[] {
  const start = relayRunningScene(level);
  const chip = start.chip;
  const frames: RelayFrame[] = [{ scene: start, hold: STEP, cues: [] }];
  const base = scene({ slots: start.slots, chip });

  if (outcome.error?.phase === "compile") {
    // Nothing leaves the laptop.
    frames.push({ scene: { ...base, laptop: "compile_error", status: "TRÌNH DỊCH TỪ CHỐI" }, hold: 0, cues: ["alarm"] });
    return frames;
  }
  if (!outcome.output) {
    // Engine error or a run cut off before any report.
    frames.push({ scene: { ...base, status: errorStatus(outcome) }, hold: 0, cues: ["alarm"] });
    return frames;
  }

  const stopped = !outcome.basePassed && (!!outcome.error || !!outcome.stopStatus);
  const breakLabel = outcome.error ? `${outcome.error.type} · dòng ${outcome.error.line ?? "?"}` : errorStatus(outcome);
  const wave = playWave(frames, base, outcome.output, stopped ? { label: breakLabel } : null);
  const after = { ...base, slots: wave.slots, extra: wave.extra, wavesLit: wave.lit };

  if (!outcome.basePassed) {
    const bad = firstProblem(wave.slots, wave.extra);
    frames.push({ scene: { ...after, status: stopped ? errorStatus(outcome) : bad ? slotLabel(bad) : "BỎ PHIÊN" }, hold: 0, cues: ["alarm"] });
    return frames;
  }
  if (outcome.sentinelCaught) {
    frames.push({ scene: { ...after, status: "SENTINEL ĐÃ KHÓA MỤC TIÊU", sentinel: true }, hold: 0, cues: ["alarm"] });
    return frames;
  }

  const loud = outcome.stars === 1;
  frames.push({
    scene: { ...after, channel: "half", status: loud ? "TÍN HIỆU BỊ GHI NHẬN" : "KÊNH MỞ MỘT NỬA", sentinel: loud },
    hold: outcome.counterVars ? 700 : 0,
    cues: ["gate_open"],
  });
  if (!outcome.counterVars) return frames;

  // Counter-attack: the station reboots with a new session.
  const counterChip = inputsLabel(level, outcome.counterInputs ?? {});
  const banner = level.counter_attack_banner ?? "CẢNH BÁO: OMNI ĐÃ THAY ĐỔI DỮ LIỆU";
  const counterExpected =
    outcome.counterOutput?.lines.map((l) => l.expected) ?? level.counter_attack_tests[0]?.expected_output ?? baseExpected(level);
  const cBase = scene({ wave: "counter", slots: idleSlots(counterExpected), channel: "half", banner, chip: counterChip, sentinel: loud });
  frames.push({ scene: { ...cBase, antenna: "off", shake: true, status: "OMNI PHẢN CÔNG" }, hold: 1200, cues: ["siren"] });

  if (outcome.counterAborted || !outcome.counterOutput) {
    frames.push({ scene: { ...cBase, status: "KÊNH VỀ MỘT NỬA · TIẾN TRÌNH BỊ CẮT" }, hold: 0, cues: ["alarm"] });
    return frames;
  }

  const counterError = outcome.error?.phase === "counter";
  const cWave = playWave(frames, cBase, outcome.counterOutput, counterError || outcome.key === "timeout" ? { label: breakLabel } : null);
  const cAfter = { ...cBase, slots: cWave.slots, extra: cWave.extra, wavesLit: cWave.lit };
  const gate = gateFor(outcome);

  if (outcome.counterSurvived) {
    frames.push({
      scene: { ...cAfter, banner: null, channel: gate, reachedEdge: gate === "open", status: gate === "open" ? "KÊNH MỞ HOÀN TOÀN" : "TÍN HIỆU BỊ GHI NHẬN" },
      hold: 0,
      cues: gate === "open" ? ["gate_open", "star"] : ["gate_open"],
    });
    return frames;
  }
  const bad = firstProblem(cWave.slots, cWave.extra);
  const reason = counterError
    ? `${outcome.error?.type ?? "LỖI"}: dòng ${outcome.error?.line ?? "?"}`
    : outcome.key === "timeout"
      ? "TIẾN TRÌNH BỊ CẮT"
      : bad
        ? slotLabel(bad)
        : "LỆCH MẪU";
  frames.push({ scene: { ...cAfter, status: `KÊNH VỀ MỘT NỬA · ${reason}` }, hold: 0, cues: ["alarm"] });
  return frames;
}

/** One sentence for screen readers: "Trạm R-17 phát 2/3 dòng. Dòng 3 sai ở vị trí 1. Kênh đóng." */
export function summarizeRelay(frames: RelayFrame[], level: LevelDefinition): string {
  const last = frames.at(-1)?.scene;
  if (!last) return "";
  const sent = last.slots.filter((s) => s.state === "sent").length;
  const parts = [`Trạm ${stationOf(level)} phát ${sent}/${last.slots.length} dòng.`];
  const bad = firstProblem(last.slots, last.extra);
  if (last.laptop === "compile_error") parts.push("Trình dịch từ chối.");
  else if (bad?.state === "dropped") parts.push(`Dòng ${bad.line} sai ở vị trí ${bad.diff?.col ?? "?"}.`);
  else if (bad?.state === "missing") parts.push(`Thiếu từ dòng ${bad.line}.`);
  else if (bad?.state === "error") parts.push(`Lỗi ${bad.label}.`);
  else if (bad?.state === "extra") parts.push("Có dòng thừa.");
  parts.push(last.channel === "open" ? "Kênh mở hoàn toàn." : last.channel === "half" ? "Kênh mở một nửa." : "Kênh đóng.");
  return parts.join(" ");
}
