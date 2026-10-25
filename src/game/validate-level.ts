import {
  REACTION_KEYS,
  VALUE_TYPES,
  type ExpectedValue,
  type LevelDefinition,
  type ValueType,
} from "./level-types";

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
  }
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
  if (isString(r.id) && r.id.trim() === "") errors.push("id không được rỗng");
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
  if (!Array.isArray(r.objectives) || r.objectives.length === 0) {
    errors.push("objectives phải là mảng không rỗng");
  } else {
    r.objectives.forEach((o, i) => {
      if (!isObject(o) || !isString(o.var) || !isString(o.label)) {
        errors.push(`objectives[${i}] thiếu var/label`);
        return;
      }
      if (!VALUE_TYPES.includes(o.type as ValueType)) {
        errors.push(`objectives[${i}].type "${String(o.type)}" không hợp lệ (int|float|str|bool)`);
        return;
      }
      objectives.push({ var: o.var, type: o.type as ValueType });
    });
  }

  if (!Number.isInteger(r.alert_limit_statements) || (r.alert_limit_statements as number) <= 0)
    errors.push("alert_limit_statements phải là số nguyên dương");
  if (typeof r.float_abs_tolerance !== "number" || !(r.float_abs_tolerance >= 0))
    errors.push("float_abs_tolerance phải là số ≥ 0");

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
      for (const name of inputs) {
        if (!isString(t.inputs[name])) errors.push(`${field}[${i}].inputs thiếu biến "${name}" (chuỗi)`);
      }
      if (!isObject(t.expected)) {
        errors.push(`${field}[${i}].expected thiếu`);
        return;
      }
      for (const o of objectives) {
        if (!(o.var in t.expected)) errors.push(`${field}[${i}].expected thiếu "${o.var}"`);
        else if (!valueMatchesType(t.expected[o.var], o.type))
          errors.push(`${field}[${i}].expected.${o.var} không khớp kiểu ${o.type}`);
      }
    });
  };
  checkTests("tests", false);
  checkTests("counter_attack_tests", true);

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

  return errors.length ? { ok: false, errors } : { ok: true, level: raw as unknown as LevelDefinition };
}
