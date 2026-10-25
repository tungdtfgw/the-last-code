export const VALUE_TYPES = ["int", "float", "str", "bool"] as const;
export type ValueType = (typeof VALUE_TYPES)[number];
export type ExpectedValue = number | string | boolean;

export const REACTION_KEYS = [
  "entry",
  "type_mismatch",
  "type_mismatch_value_match",
  "wrong_value",
  "missing_var",
  "SyntaxError",
  "IndentationError",
  "TypeError",
  "ValueError",
  "NameError",
  "ZeroDivisionError",
  "AttributeError",
  "runtime_error",
  "timeout",
  "resource_limit",
  "blocked_import",
  "input_unsupported",
  "system_exit",
  "alert_exceeded",
  "counter_ValueError",
  "counter_error",
  "counter_type_mismatch",
  "wrong_value_counter",
  "counter_timeout",
  "two_stars",
  "three_stars",
  "repeated_fail",
  "engine_error",
  "generic",
] as const;
export type ReactionKey = (typeof REACTION_KEYS)[number];

export interface Objective {
  var: string;
  type: ValueType;
  label: string;
}

export interface TestCase {
  inputs: Record<string, string>;
  expected: Record<string, ExpectedValue>;
}

export interface LevelDefinition {
  schema_version: 1;
  id: string;
  chapter: number;
  title: string;
  difficulty: string;
  concepts: string[];
  briefing: string;
  starter_code: string;
  /** 1-based editor lines that hold the chip inputs; display/lock only. */
  locked_lines: number[];
  inputs: string[];
  objectives: Objective[];
  alert_limit_statements: number;
  float_abs_tolerance: number;
  tests: TestCase[];
  counter_attack_tests: TestCase[];
  counter_attack_banner?: string;
  hints: [string, string, string];
  reactions: Partial<Record<ReactionKey, string>> & { generic: string };
  outro: string;
  lore_fragment: string;
}
