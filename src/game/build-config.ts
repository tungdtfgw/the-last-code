import { fullAlertStatements } from "./alert";
import { simulationOf, varObjectives, type LevelDefinition } from "./level-types";

export const RUN_LIMITS = {
  max_line_events: 100_000,
  max_stdout_chars: 8_000,
  max_stdout_lines: 200,
  preview_chars: 80,
} as const;

/** Config passed to the Python harness as a JSON string (so ints stay ints). */
export function buildConfig(level: LevelDefinition): string {
  return JSON.stringify({
    inputs: level.inputs,
    objectives: varObjectives(level).map((o) => ({ var: o.var, type: o.type })),
    tests: level.tests,
    counter_attack_tests: level.counter_attack_tests,
    float_abs_tolerance: level.float_abs_tolerance,
    counter_line_count_cap: fullAlertStatements(level.alert_limit_statements),
    limits: RUN_LIMITS,
    // Assignment history: only the kiosk plays it back.
    trace_vars: simulationOf(level).kind === "kiosk",
  });
}
