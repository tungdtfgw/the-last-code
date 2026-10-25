import type { StoryBeat } from "../story/story-types";

/** The four coloured shapes (GDD 5.2); also the values a `type` objective may expect. */
export const BASE_TYPES = ["int", "float", "str", "bool"] as const;
export type BaseType = (typeof BASE_TYPES)[number];
/** `type`: the variable must hold a shape itself (`int`, `str`…); its expected value names it. */
export const VALUE_TYPES = [...BASE_TYPES, "type"] as const;
export type ValueType = (typeof VALUE_TYPES)[number];
export type ExpectedValue = number | string | boolean;
/** A test input: injected into the namespace with this JSON type (1.3 uses a number and a string). */
export type InputValue = string | number | boolean;

export const REACTION_KEYS = [
  "entry",
  "type_mismatch",
  "type_mismatch_value_match",
  "type_mismatch_unknown_shape",
  "wrong_value",
  "value_is_label",
  "output_is_label",
  "value_overwritten",
  "string_repeated",
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
  "output_missing",
  "output_mismatch",
  "output_case_only",
  "output_extra",
] as const;
export type ReactionKey = (typeof REACTION_KEYS)[number];

/** A variable the scanner reads after the run (1.4). `kind` is optional so older levels stay valid. */
export interface VarObjective {
  kind?: "var";
  var: string;
  type: ValueType;
  label: string;
}

/** Line `line` (1-based) of stdout must match `expected_output[line - 1]` of every test. */
export interface OutputLineObjective {
  kind: "output_line";
  line: number;
  label: string;
}

export type Objective = VarObjective | OutputLineObjective;

export const isOutputObjective = (o: Objective): o is OutputLineObjective => o.kind === "output_line";

export const varObjectives = (level: Pick<LevelDefinition, "objectives">): VarObjective[] =>
  level.objectives.filter((o): o is VarObjective => !isOutputObjective(o));

/** Output objectives sorted by line. */
export const outputObjectives = (level: Pick<LevelDefinition, "objectives">): OutputLineObjective[] =>
  level.objectives.filter(isOutputObjective).sort((a, b) => a.line - b.line);

export interface TestCase {
  inputs: Record<string, InputValue>;
  expected: Record<string, ExpectedValue>;
  /** Expected stdout lines; required when the level has `output_line` objectives. */
  expected_output?: string[];
}

/**
 * Simulations that exist in code. A level may only name one of these, so it never
 * falls back to a scene that does not exist. Later levels add their kind here.
 */
export const SIMULATION_KINDS = ["scanner", "relay", "kiosk", "sorter"] as const;
export type SimulationKind = (typeof SIMULATION_KINDS)[number];
export type SimulationConfig =
  | { kind: "scanner" }
  /** `station`: the relay's call sign, shown in the terminal and the scene (1.1: "R-17"). */
  | { kind: "relay"; station: string }
  /** `devices`: objectives drawn as reader screens (1.2: drone scanner, zone gate); the rest are memory cells. */
  | { kind: "kiosk"; devices: string[] }
  /** Four-lane shape sorter (1.3). */
  | { kind: "sorter" };

/** The level's simulation; missing means the gate scanner. */
export const simulationOf = (level: Pick<LevelDefinition, "simulation">): SimulationConfig =>
  level.simulation ?? { kind: "scanner" };

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
  /** Optional second line per key, said instead of the first when the same key comes back on the next run. */
  reaction_variants?: Partial<Record<ReactionKey, string>>;
  outro: string;
  lore_fragment: string;
  /** Place name: shown on the entry gate and as the simulation panel title. */
  location?: string;
  /** Fake Neural-ID component this level builds, shown on the transition card. */
  component?: string;
  /** Story beats played after the lore fragment in `after-<id>`. */
  outro_beats?: StoryBeat[];
  /** Which simulation plays the run back (default: scanner). */
  simulation?: SimulationConfig;
  /** Extra words free ECHO lines must not use, on top of the common list and every answer. */
  forbidden_terms?: string[];
  /** "Việc cần làm": 2–4 plain instruction steps under the briefing; `code` in backticks renders as code. */
  task_steps?: string[];
  /** "Tổng kết kiến thức": shown after the level is passed, before the transition story. */
  knowledge_summary?: KnowledgeSummary;
}

export interface KnowledgeSection {
  heading: string;
  body: string;
  /** Runnable example; the integration test runs it with CPython. */
  code?: string;
  /** Exact stdout of `code` (shown as "Kết quả:"); requires `code`. */
  output?: string;
}

export interface KnowledgeMistake {
  code: string;
  error: string;
  explain: string;
}

export interface KnowledgeSummary {
  title: string;
  sections: KnowledgeSection[];
  mistakes: KnowledgeMistake[];
  /** "Ở màn sau" line. */
  next: string;
}
