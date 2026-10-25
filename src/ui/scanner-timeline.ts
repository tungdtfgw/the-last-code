import type { Cue } from "../audio/sound-recipes";
import type { RunOutcome, VarVerdict } from "../game/classify-run";
import type { LevelDefinition } from "../game/level-types";
import { gateFor, type GateState } from "../game/terminal-lines";
import { toneOf, type TypeTone } from "./type-colors";

export type PacketStage = "source" | "scanner" | "gate" | "through" | "bounced" | "broken" | "empty";
export type ScannerState = "idle" | "scanning" | "pass" | "reject" | "alarm";

export interface Packet {
  name: string;
  tone: TypeTone;
  typeLabel: string;
  /** Width in viewBox units. */
  width: number;
  preview: string;
  stage: PacketStage;
  verdict?: string;
}

export interface Scene {
  wave: "base" | "counter";
  packets: Packet[];
  scanner: ScannerState;
  gate: GateState;
  status: string;
  banner: string | null;
  chip: string | null;
  sentinel: boolean;
  shake: boolean;
}

export interface Frame {
  scene: Scene;
  /** How long this frame is held before the next one (ms). */
  hold: number;
  cues: Cue[];
}

/** Packet width in viewBox units: strings swell with their length (log scale), other types are fixed. */
export const PACKET_MIN_W = 48;
export const PACKET_MAX_W = 176;
export const packetWidth = (v: Pick<VarVerdict, "type" | "length">) =>
  v.type === "str" && v.length !== null
    ? Math.round(Math.min(PACKET_MAX_W, Math.max(PACKET_MIN_W, 40 + 18 * Math.log2(Math.max(1, v.length)))))
    : 64;

const shortPreview = (p: string | null) => (p === null ? "" : p.length > 14 ? p.slice(0, 13) + "…" : p);

function rawPacket(name: string, raw: string, stage: PacketStage = "source"): Packet {
  return { name, tone: "str", typeLabel: "str", width: packetWidth({ type: "str", length: raw.length }), preview: JSON.stringify(raw), stage };
}

function resultPacket(v: VarVerdict, stage: PacketStage, verdict?: string): Packet {
  if (!v.present) return { name: v.name, tone: "other", typeLabel: "—", width: 64, preview: "", stage: "empty", verdict: "KHÔNG CÓ TÍN HIỆU" };
  return { name: v.name, tone: toneOf(v.type), typeLabel: v.type ?? "?", width: packetWidth(v), preview: shortPreview(v.preview), stage, verdict };
}

const scene = (over: Partial<Scene> & Pick<Scene, "packets">): Scene => ({
  wave: "base",
  scanner: "idle",
  gate: "closed",
  status: "",
  banner: null,
  chip: null,
  sentinel: false,
  shake: false,
  ...over,
});

const inputsLabel = (level: LevelDefinition, inputs: Record<string, string>) =>
  level.inputs.map((n) => `${n} = ${JSON.stringify(inputs[n] ?? "")}`).join("  ");

/** Scene shown while Python runs (before any outcome). */
export function runningScene(level: LevelDefinition): Scene {
  const inputs = level.tests[0]?.inputs ?? {};
  return scene({
    packets: level.objectives.map((o) => ({ ...rawPacket(o.var, ""), preview: "…", width: 64 })),
    scanner: "scanning",
    status: "ĐANG XỬ LÝ",
    chip: inputsLabel(level, inputs),
  });
}

/** Resting scene before the first run. */
export function idleScene(level: LevelDefinition): Scene {
  return { ...runningScene(level), scanner: "idle", status: "CHỜ TÍN HIỆU" };
}

function failureLabel(v: VarVerdict): string {
  if (!v.present) return "KHÔNG CÓ TÍN HIỆU";
  if (!v.typeOk) return `SAI KIỂU: ${v.type} ≠ ${v.expectedType}`;
  if (!v.valueOk) return "SAI GIÁ TRỊ";
  return "HỢP LỆ";
}

function errorStatus(outcome: RunOutcome): string {
  if (outcome.key === "engine_error") return "LÕI PYTHON KHÔNG PHẢN HỒI";
  if (outcome.stopStatus === "timeout" || outcome.key === "timeout") return "TIẾN TRÌNH BỊ CẮT";
  if (outcome.stopStatus === "resource_limit") return "BỘ NHỚ QUÁ TẢI";
  if (outcome.stopStatus === "blocked_import") return "MÔ-ĐUN BỊ PHONG TỎA";
  const line = outcome.error?.line;
  return line ? `TRUY VẾT: dòng ${line}` : `LỖI: ${outcome.error?.type ?? "?"}`;
}

/** Pure description of the scanner animation for an outcome; the component only plays it back. */
export function buildTimeline(outcome: RunOutcome, level: LevelDefinition): Frame[] {
  const frames: Frame[] = [];
  const baseInputs = level.tests[0]?.inputs ?? {};
  const chip = inputsLabel(level, baseInputs);
  const start = runningScene(level);
  frames.push({ scene: start, hold: 450, cues: [] });

  const graded = outcome.basePassed || (!outcome.error && !outcome.stopStatus && outcome.key !== "engine_error");
  if (!graded) {
    // Errors, timeouts, blocked imports: packets never leave the source.
    frames.push({
      scene: scene({ packets: start.packets, scanner: "alarm", gate: "closed", status: errorStatus(outcome), chip }),
      hold: 0,
      cues: ["alarm"],
    });
    return frames;
  }

  // Base wave: packets slide one by one through the scanner.
  const packets = outcome.vars.map((v) => (v.present ? { ...rawPacket(v.name, ""), preview: "…", width: 64 } : resultPacket(v, "empty")));
  outcome.vars.forEach((v, i) => {
    if (!v.present) return;
    const ok = v.typeOk && v.valueOk;
    packets[i] = resultPacket(v, ok ? "gate" : "bounced", ok ? "HỢP LỆ" : failureLabel(v));
    frames.push({
      scene: scene({ packets: [...packets], scanner: ok ? "pass" : "reject", gate: "closed", status: ok ? "HỢP LỆ" : failureLabel(v), chip }),
      hold: 450,
      cues: [ok ? "scan_pass" : "scan_reject"],
    });
  });

  if (!outcome.basePassed) {
    const firstBad = outcome.vars.find((v) => !v.present || !v.typeOk || !v.valueOk);
    frames.push({
      scene: scene({ packets: [...packets], scanner: "alarm", gate: "closed", status: firstBad ? failureLabel(firstBad) : "TỪ CHỐI", chip }),
      hold: 0,
      cues: ["alarm"],
    });
    return frames;
  }

  if (outcome.sentinelCaught) {
    frames.push({
      scene: scene({ packets: [...packets], scanner: "alarm", gate: "closed", status: "SENTINEL ĐÃ KHÓA MỤC TIÊU", sentinel: true, chip }),
      hold: 0,
      cues: ["alarm"],
    });
    return frames;
  }

  const through = packets.map((p) => ({ ...p, stage: "through" as PacketStage }));
  const loud = outcome.stars === 1;
  frames.push({
    scene: scene({
      packets: through,
      scanner: "pass",
      gate: "half",
      status: loud ? "TÍN HIỆU BỊ GHI NHẬN" : "CỔNG MỞ MỘT NỬA",
      sentinel: loud,
      chip,
    }),
    hold: outcome.counterVars ? 700 : 0,
    cues: ["gate_open"],
  });

  if (!outcome.counterVars) return frames;

  // Counter-attack wave.
  const counterInputs = outcome.counterInputs ?? {};
  const counterChip = inputsLabel(level, counterInputs);
  const banner = level.counter_attack_banner ?? "CẢNH BÁO: OMNI ĐÃ THAY ĐỔI DỮ LIỆU";
  const cPackets = outcome.counterVars.map((v) => ({ ...rawPacket(v.name, ""), preview: "…", width: 64 }));
  frames.push({
    scene: scene({ wave: "counter", packets: [...cPackets], scanner: "scanning", gate: "half", status: "OMNI PHẢN CÔNG", banner, chip: counterChip, shake: true, sentinel: loud }),
    hold: 1200,
    cues: ["siren"],
  });

  if (outcome.counterAborted) {
    // The program hung on the new chip data: nothing leaves the source.
    frames.push({
      scene: scene({ wave: "counter", packets: [...cPackets], scanner: "alarm", gate: "half", status: "CỔNG SẬP VỀ NỬA · TIẾN TRÌNH BỊ CẮT", banner, chip: counterChip, sentinel: loud }),
      hold: 0,
      cues: ["alarm"],
    });
    return frames;
  }

  const counterError = outcome.error?.phase === "counter";
  outcome.counterVars.forEach((v, i) => {
    let p: Packet;
    let ok = false;
    if (counterError && !v.present) p = { ...cPackets[i], stage: "broken", verdict: outcome.error?.type ?? "LỖI" };
    else if (!v.present || !v.typeOk) p = resultPacket(v, "bounced", failureLabel(v));
    else if (!v.valueOk) p = resultPacket(v, "gate", "LỆCH MẪU");
    else {
      p = resultPacket(v, "gate", "HỢP LỆ");
      ok = true;
    }
    cPackets[i] = p;
    frames.push({
      scene: scene({ wave: "counter", packets: [...cPackets], scanner: ok ? "pass" : "reject", gate: "half", status: p.verdict ?? "", banner, chip: counterChip, sentinel: loud }),
      hold: 450,
      cues: [ok ? "scan_pass" : "scan_reject"],
    });
  });

  const gate = gateFor(outcome);
  if (outcome.counterSurvived) {
    frames.push({
      scene: scene({
        wave: "counter",
        packets: cPackets.map((p) => ({ ...p, stage: "through" })),
        scanner: "pass",
        gate,
        status: gate === "open" ? "CỔNG MỞ HOÀN TOÀN" : "TÍN HIỆU BỊ GHI NHẬN",
        chip: counterChip,
        sentinel: loud,
      }),
      hold: 0,
      cues: gate === "open" ? ["gate_open", "star"] : ["gate_open"],
    });
  } else {
    const status = counterError
      ? `${outcome.error?.type ?? "LỖI"}: dòng ${outcome.error?.line ?? "?"}`
      : outcome.key === "timeout"
        ? "TIẾN TRÌNH BỊ CẮT"
        : outcome.key === "wrong_value_counter"
          ? "LỆCH MẪU"
          : "SAI KIỂU";
    frames.push({
      scene: scene({ wave: "counter", packets: [...cPackets], scanner: "alarm", gate: "half", status: `CỔNG SẬP VỀ NỬA · ${status}`, banner, chip: counterChip, sentinel: loud }),
      hold: 0,
      cues: ["alarm"],
    });
  }
  return frames;
}

export const timelineDuration = (frames: Frame[]) => frames.reduce((t, f) => t + f.hold, 0);

/** One sentence for screen readers describing the final state. */
export function summarize(frames: Frame[]): string {
  const last = frames[frames.length - 1]?.scene;
  if (!last) return "";
  const gate = last.gate === "open" ? "mở hoàn toàn" : last.gate === "half" ? "mở một nửa" : "đóng";
  return `Máy quét: ${last.status}. Cổng ${gate}.`;
}
