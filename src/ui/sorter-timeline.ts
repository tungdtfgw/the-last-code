import type { Cue } from "../audio/sound-recipes";
import type { RunOutcome, VarVerdict } from "../game/classify-run";
import { varObjectives, type BaseType, type InputValue, type LevelDefinition } from "../game/level-types";
import { pyTypeOf } from "../game/python-literal";
import { gateFor, type GateState } from "../game/terminal-lines";
import { errorStatus, inputsLabel } from "./scanner-timeline";
import { toneOf, type TypeTone } from "./type-colors";

/** The four lanes, top to bottom (GDD 1.3 §5): each one takes one shape. */
export type Lane = BaseType;
export const LANES: readonly Lane[] = ["str", "int", "float", "bool"];

/**
 * Where a parcel is: on the belt, in a lane (passing through), locked into its
 * lane's slot, dropped in the hold bin, set in the mould slot (a shape), or absent.
 */
export type ParcelStage = "belt" | "lane" | "slot" | "bin" | "stamp" | "empty";
export type SorterScanner = "idle" | "scanning" | "pass" | "reject" | "alarm";

export interface Parcel {
  name: string;
  /** `stamp`: the variable holds a shape (`int`); drawn as a hexagon. */
  kind: "parcel" | "stamp";
  /** Parcel: colour of its real shape. Stamp: colour of the shape it carries. */
  tone: TypeTone;
  /** Real shape (`str`, `tuple`…); for a stamp, the shape it carries. */
  typeLabel: string;
  /** Lane of its real shape, null when it has none (grey). */
  lane: Lane | null;
  stage: ParcelStage;
  verdict?: string;
  ok?: boolean;
  preview: string;
}

export interface SorterScene {
  wave: "base" | "counter";
  parcels: Parcel[];
  /** Variables each lane's slots ask for. */
  slots: Record<Lane, string[]>;
  /** Session card (the input), coloured by the shape of this wave's value. */
  session: { label: string; tone: TypeTone } | null;
  scanner: SorterScanner;
  gate: GateState;
  status: string;
  banner: string | null;
  sentinel: boolean;
  shake: boolean;
}

export interface SorterFrame {
  scene: SorterScene;
  hold: number;
  cues: Cue[];
}

const isLane = (t: string | null): t is Lane => LANES.includes(t as Lane);

/** Shape carried by a shape value, read from its preview `<class 'int'>`. */
export const carriedShape = (preview: string | null) => /^<class '(.+)'>$/.exec(preview ?? "")?.[1] ?? "?";

function slotsOf(level: LevelDefinition): Record<Lane, string[]> {
  const slots = { str: [], int: [], float: [], bool: [] } as Record<Lane, string[]>;
  for (const o of varObjectives(level)) if (isLane(o.type)) slots[o.type].push(o.var);
  return slots;
}

function sessionOf(level: LevelDefinition, inputs: Record<string, InputValue>): SorterScene["session"] {
  const first = level.inputs[0];
  if (first === undefined || inputs[first] === undefined) return null;
  return { label: inputsLabel(level, inputs), tone: toneOf(pyTypeOf(inputs[first])) };
}

const onBelt = (name: string): Parcel => ({ name, kind: "parcel", tone: "other", typeLabel: "", lane: null, stage: "belt", preview: "" });

/** Final place and label of one graded variable (GDD 1.3 §5, "Đường đi của một gói"). */
export function routeParcel(v: VarVerdict): Parcel {
  const preview = v.preview ?? "";
  if (!v.present) return { ...onBelt(v.name), stage: "empty", verdict: "KHÔNG CÓ TÍN HIỆU", ok: false };
  if (v.expectedType === "type" && v.type === "type") {
    const shape = carriedShape(v.preview);
    return {
      name: v.name,
      kind: "stamp",
      tone: toneOf(shape),
      typeLabel: shape,
      lane: null,
      stage: "stamp",
      verdict: v.valueOk ? "KHỚP KHUÔN" : "LỆCH KHUÔN",
      ok: v.valueOk,
      preview,
    };
  }
  const real = v.type ?? "?";
  const base = { name: v.name, kind: "parcel" as const, tone: toneOf(real), typeLabel: real, preview };
  if (v.typeOk) {
    return { ...base, lane: isLane(real) ? real : null, stage: "slot", verdict: v.valueOk ? "HỢP LỆ" : "LỆCH MẪU", ok: v.valueOk };
  }
  if (isLane(real)) return { ...base, lane: real, stage: "bin", verdict: `SAI LÀN: ${real} ≠ ${v.expectedType}`, ok: false };
  if (real === "type") return { ...base, lane: null, stage: "bin", verdict: `SAI LÀN: type ≠ ${v.expectedType}`, ok: false };
  return { ...base, tone: "other", lane: null, stage: "bin", verdict: "KHÔNG RÕ HÌNH DẠNG", ok: false };
}

/** Shapes (the mould stamp) run last, after the fields. */
const runOrder = (vars: VarVerdict[]) => [
  ...vars.map((_, i) => i).filter((i) => vars[i].expectedType !== "type"),
  ...vars.map((_, i) => i).filter((i) => vars[i].expectedType === "type"),
];

function scene(level: LevelDefinition, over: Partial<SorterScene> & Pick<SorterScene, "parcels">): SorterScene {
  return {
    wave: "base",
    slots: slotsOf(level),
    session: sessionOf(level, level.tests[0]?.inputs ?? {}),
    scanner: "idle",
    gate: "closed",
    status: "",
    banner: null,
    sentinel: false,
    shake: false,
    ...over,
  };
}

/** While Python runs: grey parcels named after the objectives wait on the belt. */
export function runningSorterScene(level: LevelDefinition): SorterScene {
  return scene(level, { parcels: varObjectives(level).map((o) => onBelt(o.var)), scanner: "scanning", status: "ĐANG XỬ LÝ" });
}

export function idleSorterScene(level: LevelDefinition): SorterScene {
  return { ...runningSorterScene(level), scanner: "idle", status: "CHỜ HỒ SƠ" };
}

/**
 * One wave: each parcel through the scanner. A parcel in the wrong lane first runs
 * along the lane of its real shape, then drops into the bin.
 */
function wave(
  vars: VarVerdict[],
  base: SorterScene,
  frames: SorterFrame[],
  { fast }: { fast: boolean },
): Parcel[] {
  const parcels = base.parcels.map((p) => ({ ...p }));
  for (const i of runOrder(vars)) {
    const p = routeParcel(vars[i]);
    const stamp = p.kind === "stamp";
    if (p.stage === "bin" && p.lane && !fast) {
      parcels[i] = { ...p, stage: "lane", verdict: undefined };
      frames.push({ scene: { ...base, parcels: [...parcels], scanner: "scanning", status: `${p.name}: ${p.typeLabel}` }, hold: 380, cues: [] });
    }
    parcels[i] = p;
    frames.push({
      scene: { ...base, parcels: [...parcels], scanner: p.ok ? "pass" : "reject", status: `${p.name} · ${p.verdict}` },
      hold: stamp ? 900 : fast ? 300 : 450,
      cues: [p.ok ? "scan_pass" : "scan_reject"],
    });
  }
  return parcels;
}

const failureOf = (vars: VarVerdict[]) => {
  const bad = vars.map(routeParcel).find((p) => !p.ok);
  return bad?.verdict ?? "TỪ CHỐI";
};

/** Pure description of the sorter animation for an outcome; the component only plays it back. */
export function buildSorterTimeline(outcome: RunOutcome, level: LevelDefinition): SorterFrame[] {
  const start = runningSorterScene(level);
  const frames: SorterFrame[] = [{ scene: start, hold: 450, cues: [] }];

  const graded = outcome.basePassed || (!outcome.error && !outcome.stopStatus && outcome.key !== "engine_error");
  if (!graded) {
    // Python errors, timeouts, blocked imports: nothing leaves the belt.
    frames.push({ scene: { ...start, scanner: "alarm", status: errorStatus(outcome) }, hold: 0, cues: ["alarm"] });
    return frames;
  }

  const base = { ...start, scanner: "scanning" as const, status: "" };
  const parcels = wave(outcome.vars, base, frames, { fast: false });

  if (!outcome.basePassed) {
    frames.push({ scene: { ...base, parcels, scanner: "alarm", status: failureOf(outcome.vars) }, hold: 0, cues: ["alarm"] });
    return frames;
  }
  if (outcome.sentinelCaught) {
    frames.push({ scene: { ...base, parcels, scanner: "alarm", status: "SENTINEL ĐÃ KHÓA MỤC TIÊU", sentinel: true }, hold: 0, cues: ["alarm"] });
    return frames;
  }
  const loud = outcome.stars === 1;
  frames.push({
    scene: { ...base, parcels, scanner: "pass", gate: "half", status: loud ? "TÍN HIỆU BỊ GHI NHẬN" : "RÀO MỞ MỘT NỬA", sentinel: loud },
    hold: outcome.counterVars ? 700 : 0,
    cues: ["gate_open"],
  });
  if (!outcome.counterVars) return frames;

  // Counter-attack: a new session code, maybe of another shape; the parcels run again, fast.
  const counter: SorterScene = {
    ...base,
    wave: "counter",
    parcels: start.parcels,
    session: sessionOf(level, outcome.counterInputs ?? {}),
    gate: "half",
    banner: level.counter_attack_banner ?? "CẢNH BÁO: OMNI ĐÃ THAY ĐỔI DỮ LIỆU",
    sentinel: loud,
  };
  frames.push({ scene: { ...counter, status: "OMNI PHẢN CÔNG", shake: true }, hold: 1200, cues: ["siren"] });

  if (outcome.counterAborted || outcome.error?.phase === "counter" || outcome.key === "timeout") {
    const why =
      outcome.counterAborted === "engine_error"
        ? "LÕI PYTHON KHÔNG PHẢN HỒI"
        : outcome.counterAborted || outcome.key === "timeout"
          ? "TIẾN TRÌNH BỊ CẮT"
          : `${outcome.error?.type ?? "LỖI"}: dòng ${outcome.error?.line ?? "?"}`;
    frames.push({ scene: { ...counter, scanner: "alarm", status: `RÀO SẬP VỀ NỬA · ${why}` }, hold: 0, cues: ["alarm"] });
    return frames;
  }

  const cParcels = wave(outcome.counterVars, counter, frames, { fast: true });
  const gate = gateFor(outcome);
  if (outcome.counterSurvived) {
    frames.push({
      scene: { ...counter, parcels: cParcels, banner: null, scanner: "pass", gate, status: gate === "open" ? "RÀO MỞ HOÀN TOÀN" : "TÍN HIỆU BỊ GHI NHẬN" },
      hold: 0,
      cues: gate === "open" ? ["gate_open", "star"] : ["gate_open"],
    });
  } else {
    frames.push({
      scene: { ...counter, parcels: cParcels, scanner: "alarm", status: `RÀO SẬP VỀ NỬA · ${failureOf(outcome.counterVars)}` },
      hold: 0,
      cues: ["alarm"],
    });
  }
  return frames;
}

/** One sentence for screen readers: "Máy phân loại: 4/5 trường vào đúng làn. Rào mở một nửa." */
export function summarizeSorter(frames: SorterFrame[]): string {
  const last = frames.at(-1)?.scene;
  if (!last) return "";
  const gate = last.gate === "open" ? "mở hoàn toàn" : last.gate === "half" ? "mở một nửa" : "đóng";
  const graded = last.parcels.filter((p) => p.verdict);
  const head = graded.length ? `${graded.filter((p) => p.ok).length}/${last.parcels.length} trường vào đúng làn` : last.status;
  return `Máy phân loại: ${head}. Rào ${gate}.`;
}
