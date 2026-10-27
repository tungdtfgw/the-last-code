import {
  BASE_TYPES,
  REACTION_KEYS,
  SIMULATION_KINDS,
  VALUE_TYPES,
  type SimulationKind,
  type ExpectedValue,
  type LevelDefinition,
  type ValueType,
} from "./level-types.js";
import { validateBeats } from "../story/validate-beats.js";
import { findEchoLeak, levelLeaks, type LeakSet } from "./echo-leaks.js";

export type ValidationResult =
  | { ok: true; level: LevelDefinition }
  | { ok: false; errors: string[] };

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const isString = (v: unknown): v is string => typeof v === "string";
const isStringArray = (v: unknown): v is string[] => Array.isArray(v) && v.every(isString);

function valueMatchesType(value: unknown, type: ValueType): value is ExpectedValue {
  switch (type) {
    case "bool":
      return typeof value === "boolean";
    case "int":
      return typeof value === "number" && Number.isInteger(value);
    case "float":
      return typeof value === "number" && Number.isFinite(value);
    case "str":
      return typeof value === "string";
    case "type":
      return BASE_TYPES.includes(value as never);
  }
}

/** A test input value: a string, a finite number or a bool (no object, array or null). */
const isInputValue = (v: unknown) => typeof v === "string" || typeof v === "boolean" || (typeof v === "number" && Number.isFinite(v));

/** Kiosk layout: 1–3 reader screens and 1–6 memory cells (two columns), all of them objectives. */
function checkKiosk(devices: unknown, objectiveVars: string[], errors: string[]) {
  if (!isStringArray(devices) || devices.length < 1 || devices.length > 3) {
    errors.push("simulation.devices phải là mảng 1–3 tên biến mục tiêu");
    return;
  }
  devices.forEach((d, i) => {
    if (devices.indexOf(d) !== i) errors.push(`simulation.devices[${i}] "${d}" bị trùng`);
    else if (!objectiveVars.includes(d)) errors.push(`simulation.devices[${i}] "${d}" không phải biến mục tiêu`);
  });
  const cells = objectiveVars.filter((v) => !devices.includes(v)).length;
  if (cells < 1 || cells > 6) errors.push(`simulation.devices: ki-ốt cần 1–6 ô nhớ (mục tiêu không phải thiết bị), đang có ${cells}`);
}

/** Sorter layout: five belt rows, one slot per lane, one mould slot. */
function checkSorter(objectives: { var: string; type: ValueType }[], errors: string[]) {
  if (objectives.length > 5) errors.push(`simulation: máy phân loại có tối đa 5 mục tiêu biến, đang có ${objectives.length}`);
  for (const type of VALUE_TYPES) {
    const same = objectives.filter((o) => o.type === type);
    if (same.length > 1) errors.push(`simulation: máy phân loại chỉ có một khe cho kiểu ${type} (${same.map((o) => o.var).join(", ")})`);
  }
}

/** Keys each simulation kind accepts; a new kind adds its entry here. */
const SIM_KEYS: Record<SimulationKind, readonly string[]> = {
  scanner: ["kind"],
  relay: ["kind", "station"],
  kiosk: ["kind", "devices"],
  sorter: ["kind"],
};

/** Limits of a test's stdin channel: lines `input()` reads. */
const STDIN_MAX_LINES = 20;
const STDIN_MAX_CHARS = 200;

function checkStdin(stdin: unknown, path: string, errors: string[]) {
  if (!isStringArray(stdin)) {
    errors.push(`${path} phải là mảng chuỗi`);
    return;
  }
  if (stdin.length > STDIN_MAX_LINES) errors.push(`${path} có tối đa ${STDIN_MAX_LINES} dòng, đang có ${stdin.length}`);
  stdin.forEach((line, j) => {
    if (/[\r\n]/.test(line)) errors.push(`${path}[${j}] không được chứa xuống dòng`);
    else if (line.length > STDIN_MAX_CHARS) errors.push(`${path}[${j}] dài quá ${STDIN_MAX_CHARS} ký tự`);
  });
}

const nonEmpty = (v: unknown): v is string => isString(v) && v.trim() !== "";

/** Every listed key must be a non-empty string (optional ones only when present); unlisted keys are typos. */
function checkTextObject(
  v: unknown,
  path: string,
  keys: { required: string[]; optional?: string[]; other?: string[] },
  errors: string[],
): v is Record<string, unknown> {
  if (!isObject(v)) {
    errors.push(`${path} phải là object`);
    return false;
  }
  const { required, optional = [], other = [] } = keys;
  for (const k of required) if (!nonEmpty(v[k])) errors.push(`${path}.${k} phải là chuỗi không rỗng`);
  for (const k of optional) if (v[k] !== undefined && !nonEmpty(v[k])) errors.push(`${path}.${k} phải là chuỗi không rỗng`);
  for (const k of Object.keys(v)) if (![...required, ...optional, ...other].includes(k)) errors.push(`${path}: khóa lạ "${k}"`);
  return true;
}

/** Knowledge summary: shape only (it teaches openly, so no leak check). */
function checkKnowledgeSummary(ks: unknown, errors: string[]) {
  if (!checkTextObject(ks, "knowledge_summary", { required: ["title", "next"], other: ["sections", "mistakes"] }, errors)) return;
  if (!Array.isArray(ks.sections) || ks.sections.length === 0) errors.push("knowledge_summary.sections phải là mảng không rỗng");
  else
    ks.sections.forEach((s, i) => {
      const path = `knowledge_summary.sections[${i}]`;
      if (!checkTextObject(s, path, { required: ["heading", "body"], optional: ["code", "output"], other: ["stdin"] }, errors)) return;
      if (s.output !== undefined && s.code === undefined) errors.push(`${path}.output cần code đi kèm`);
      if (s.stdin !== undefined) {
        if (!isString(s.stdin)) errors.push(`${path}.stdin phải là chuỗi`);
        else if (s.code === undefined) errors.push(`${path}.stdin cần code đi kèm`);
      }
    });
  if (!Array.isArray(ks.mistakes)) errors.push("knowledge_summary.mistakes phải là mảng");
  else ks.mistakes.forEach((m, i) => checkTextObject(m, `knowledge_summary.mistakes[${i}]`, { required: ["code", "error", "explain"] }, errors));
}

/** Hand-written validator: every error message names the offending field. */
export function validateLevel(raw: unknown): ValidationResult {
  const errors: string[] = [];
  if (!isObject(raw)) return { ok: false, errors: ["level phải là một object JSON"] };
  const r = raw;

  if (r.schema_version !== 1) errors.push("schema_version phải là 1");
  for (const key of ["id", "title", "difficulty", "briefing", "starter_code", "outro", "lore_fragment"]) {
    if (!isString(r[key])) errors.push(`${key} phải là chuỗi`);
  }
  if (isString(r.id) && !/^[\w.-]{1,64}$/.test(r.id)) errors.push("id chỉ gồm chữ, số, '.', '-', '_' (1–64 ký tự) để mở được bằng địa chỉ #/level/<id>");
  if (typeof r.chapter !== "number") errors.push("chapter phải là số");
  if (!isStringArray(r.concepts)) errors.push("concepts phải là mảng chuỗi");
  if (r.counter_attack_banner !== undefined && !isString(r.counter_attack_banner))
    errors.push("counter_attack_banner phải là chuỗi");

  const starterLines = isString(r.starter_code) ? r.starter_code.replace(/\r\n/g, "\n").split("\n") : [];

  if (!isStringArray(r.inputs)) errors.push("inputs phải là mảng tên biến");
  const inputs = isStringArray(r.inputs) ? r.inputs : [];

  if (!Array.isArray(r.locked_lines) || !r.locked_lines.every((n) => Number.isInteger(n))) {
    errors.push("locked_lines phải là mảng số nguyên");
  } else {
    for (const n of r.locked_lines as number[]) {
      if (n < 1 || n > starterLines.length) errors.push(`locked_lines: dòng ${n} nằm ngoài starter_code`);
    }
    const sorted = [...(r.locked_lines as number[])].sort((a, b) => a - b);
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] !== sorted[i - 1] + 1) errors.push("locked_lines phải là một khối dòng liên tiếp");
    }
    // Each input must be assigned on one of the locked lines.
    const lockedText = (r.locked_lines as number[]).map((n) => starterLines[n - 1] ?? "");
    for (const name of inputs) {
      if (!lockedText.some((line) => line.trimStart().startsWith(`${name} =`)))
        errors.push(`locked_lines không chứa dòng gán biến đầu vào "${name}"`);
    }
  }

  const objectives: { var: string; type: ValueType }[] = [];
  const outputLines: number[] = [];
  if (!Array.isArray(r.objectives) || r.objectives.length === 0) {
    errors.push("objectives phải là mảng không rỗng");
  } else {
    r.objectives.forEach((o, i) => {
      if (!isObject(o) || !isString(o.label)) {
        errors.push(`objectives[${i}] thiếu label`);
        return;
      }
      if (o.kind === "output_line") {
        if (!Number.isInteger(o.line) || (o.line as number) < 1) errors.push(`objectives[${i}].line phải là số nguyên dương`);
        else outputLines.push(o.line as number);
        return;
      }
      if (o.kind !== undefined && o.kind !== "var") {
        errors.push(`objectives[${i}].kind "${String(o.kind)}" không hợp lệ (var|output_line)`);
        return;
      }
      if (!isString(o.var)) {
        errors.push(`objectives[${i}] thiếu var/label`);
        return;
      }
      if (!VALUE_TYPES.includes(o.type as ValueType)) {
        errors.push(`objectives[${i}].type "${String(o.type)}" không hợp lệ (${VALUE_TYPES.join("|")})`);
        return;
      }
      objectives.push({ var: o.var, type: o.type as ValueType });
    });
  }
  // Output lines must be exactly 1..N: each test then lists N lines.
  const outputCount = outputLines.length;
  const sortedLines = [...outputLines].sort((a, b) => a - b);
  if (sortedLines.some((n, i) => n !== i + 1))
    errors.push(`objectives: các dòng output_line phải là 1..${outputCount}, không trùng (đang có ${sortedLines.join(", ")})`);

  if (!Number.isInteger(r.alert_limit_statements) || (r.alert_limit_statements as number) <= 0)
    errors.push("alert_limit_statements phải là số nguyên dương");
  if (typeof r.float_abs_tolerance !== "number" || !(r.float_abs_tolerance >= 0))
    errors.push("float_abs_tolerance phải là số ≥ 0");

  // The stdin channel is all or nothing: every base and counter test has `stdin`, or none does.
  const withStdin: string[] = [];
  const withoutStdin: string[] = [];
  const checkTests = (field: "tests" | "counter_attack_tests", allowEmpty: boolean) => {
    const tests = r[field];
    if (!Array.isArray(tests) || (!allowEmpty && tests.length === 0)) {
      errors.push(`${field} phải là mảng${allowEmpty ? "" : " không rỗng"}`);
      return;
    }
    tests.forEach((t, i) => {
      if (!isObject(t) || !isObject(t.inputs)) {
        errors.push(`${field}[${i}].inputs thiếu`);
        return;
      }
      if (t.stdin === undefined) withoutStdin.push(`${field}[${i}]`);
      else {
        withStdin.push(`${field}[${i}]`);
        checkStdin(t.stdin, `${field}[${i}].stdin`, errors);
      }
      // Note: a round float (2.0) arrives as an int through JSON; do not use one as a float input.
      for (const name of inputs) {
        if (!(name in t.inputs)) errors.push(`${field}[${i}].inputs thiếu biến "${name}" (chuỗi)`);
        else if (!isInputValue(t.inputs[name])) errors.push(`${field}[${i}].inputs.${name} phải là chuỗi, số hoặc bool`);
      }
      if (!isObject(t.expected)) {
        errors.push(`${field}[${i}].expected thiếu`);
        return;
      }
      for (const o of objectives) {
        if (!(o.var in t.expected)) errors.push(`${field}[${i}].expected thiếu "${o.var}"`);
        else if (!valueMatchesType(t.expected[o.var], o.type))
          errors.push(
            o.type === "type"
              ? `${field}[${i}].expected.${o.var} phải là tên một kiểu (${BASE_TYPES.join("|")})`
              : `${field}[${i}].expected.${o.var} không khớp kiểu ${o.type}`,
          );
      }
      const out = t.expected_output;
      if (outputCount === 0) {
        if (out !== undefined) errors.push(`${field}[${i}].expected_output thừa: level không có mục tiêu output_line`);
      } else if (!isStringArray(out) || out.length !== outputCount) {
        errors.push(`${field}[${i}].expected_output phải là mảng đúng ${outputCount} chuỗi`);
      } else {
        out.forEach((line, j) => {
          if (/[\r\n]/.test(line)) errors.push(`${field}[${i}].expected_output[${j}] không được chứa xuống dòng`);
          // Trailing whitespace is stripped from the player's output, so such a line could never match.
          else if (line !== line.trimEnd()) errors.push(`${field}[${i}].expected_output[${j}] có khoảng trắng cuối dòng`);
        });
      }
    });
  };
  checkTests("tests", false);
  checkTests("counter_attack_tests", true);
  if (withStdin.length > 0 && withoutStdin.length > 0)
    errors.push(`stdin: mọi test và test phản công phải cùng có hoặc cùng không có kênh nhập (thiếu ở ${withoutStdin.join(", ")})`);

  if (!isStringArray(r.hints) || r.hints.length !== 3) errors.push("hints phải có đúng 3 mức (chuỗi)");

  if (!isObject(r.reactions)) {
    errors.push("reactions phải là object");
  } else {
    if (!isString(r.reactions.generic)) errors.push('reactions thiếu khóa "generic"');
    for (const [k, v] of Object.entries(r.reactions)) {
      if (!REACTION_KEYS.includes(k as never)) errors.push(`reactions: khóa lạ "${k}"`);
      else if (!isString(v)) errors.push(`reactions.${k} phải là chuỗi`);
    }
  }

  if (r.reaction_variants !== undefined) {
    if (!isObject(r.reaction_variants)) {
      errors.push("reaction_variants phải là object");
    } else {
      for (const [k, v] of Object.entries(r.reaction_variants)) {
        if (!REACTION_KEYS.includes(k as never)) errors.push(`reaction_variants: khóa lạ "${k}"`);
        else if (!isString(v) || v.trim() === "") errors.push(`reaction_variants.${k} phải là chuỗi không rỗng`);
        else if (isObject(r.reactions) && !isString(r.reactions[k])) errors.push(`reaction_variants.${k} cần câu chính trong reactions`);
      }
    }
  }

  if (r.simulation !== undefined) {
    const sim = r.simulation;
    if (!isObject(sim) || !SIMULATION_KINDS.includes(sim.kind as never)) {
      errors.push(`simulation.kind phải là một trong ${SIMULATION_KINDS.join("|")}`);
    } else {
      const allowed = SIM_KEYS[sim.kind as SimulationKind];
      for (const k of Object.keys(sim)) if (!allowed.includes(k)) errors.push(`simulation: khóa lạ "${k}" cho kind "${sim.kind}"`);
      if (sim.kind === "relay" && (!isString(sim.station) || sim.station.trim() === "" || sim.station.length > 12))
        errors.push("simulation.station phải là chuỗi không rỗng ≤ 12 ký tự");
      if (sim.kind === "kiosk") checkKiosk(sim.devices, objectives.map((o) => o.var), errors);
      if (sim.kind === "sorter") checkSorter(objectives, errors);
    }
  }

  if (r.forbidden_terms !== undefined && (!isStringArray(r.forbidden_terms) || r.forbidden_terms.some((t) => t.trim() === "")))
    errors.push("forbidden_terms phải là mảng chuỗi không rỗng");

  // Story fields (optional): where the level happens, what it builds, and the beats after it.
  for (const key of ["location", "component"]) {
    const v = r[key];
    if (v !== undefined && (!isString(v) || v.trim() === "" || v.length > 60))
      errors.push(`${key} phải là chuỗi không rỗng ≤ 60 ký tự`);
  }
  const wellFormed = (v: unknown) =>
    Array.isArray(v) &&
    v.every((t) => isObject(t) && isObject(t.expected) && (t.expected_output === undefined || isStringArray(t.expected_output)));
  const leaks: LeakSet | undefined =
    wellFormed(r.tests) && wellFormed(r.counter_attack_tests) && (r.forbidden_terms === undefined || isStringArray(r.forbidden_terms))
      ? levelLeaks(raw as unknown as LevelDefinition)
      : undefined;
  if (r.outro_beats !== undefined) validateBeats(r.outro_beats, "outro_beats", errors, (text) => findEchoLeak(text, leaks));

  // Task steps say what to do, never the answer; they may name functions such as `print`.
  if (r.task_steps !== undefined) {
    if (!isStringArray(r.task_steps) || r.task_steps.length < 2 || r.task_steps.length > 4) {
      errors.push("task_steps phải là mảng 2–4 chuỗi");
    } else {
      const answers: LeakSet = { terms: [], answers: leaks?.answers ?? [] };
      r.task_steps.forEach((step, i) => {
        if (step.trim() === "") errors.push(`task_steps[${i}] rỗng`);
        else {
          const leak = findEchoLeak(step, answers);
          if (leak) errors.push(`task_steps[${i}] lộ đáp án "${leak}"`);
        }
      });
    }
  }
  if (r.knowledge_summary !== undefined) checkKnowledgeSummary(r.knowledge_summary, errors);

  return errors.length ? { ok: false, errors } : { ok: true, level: raw as unknown as LevelDefinition };
}
