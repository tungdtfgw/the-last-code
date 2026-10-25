import type { BaseType, InputValue } from "./level-types";

/** An input value as Python source: `"7351"`, `4096`, `True` (strings keep the JSON quoting 1.4 always showed). */
export const formatPyLiteral = (v: InputValue): string =>
  typeof v === "string" ? JSON.stringify(v) : typeof v === "boolean" ? (v ? "True" : "False") : String(v);

/** The Python shape an input value gets once injected (JSON numbers without a fraction are ints). */
export const pyTypeOf = (v: InputValue): BaseType =>
  typeof v === "string" ? "str" : typeof v === "boolean" ? "bool" : Number.isInteger(v) ? "int" : "float";
