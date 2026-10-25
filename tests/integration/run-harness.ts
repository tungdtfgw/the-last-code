import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { HarnessReport } from "../../src/engine/harness-types";
import { buildConfig } from "../../src/game/build-config";
import { classifyRun, type RunOutcome } from "../../src/game/classify-run";
import type { LevelDefinition } from "../../src/game/level-types";
import { prepareSource } from "../../src/game/prepare-source";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));

export const readFixture = (name: string) =>
  readFileSync(new URL(`../fixtures/solutions/${name}.py`, import.meta.url), "utf8");

/** Run the real Python harness with local python3 (fails loudly when python3 is missing). */
export function runHarness(level: LevelDefinition, editorText: string): HarnessReport {
  const source = prepareSource(editorText, level.locked_lines);
  const proc = spawnSync("python3", ["tests/python/harness_cli.py"], {
    cwd: ROOT,
    input: JSON.stringify({ config: buildConfig(level), source }),
    encoding: "utf8",
    timeout: 20_000,
  });
  if (proc.error) throw new Error(`python3 không chạy được (cần python3 trong PATH): ${proc.error.message}`);
  if (proc.status !== 0) throw new Error(`harness_cli lỗi: ${proc.stderr}`);
  return JSON.parse(proc.stdout) as HarnessReport;
}

export const gradeFixture = (level: LevelDefinition, name: string): RunOutcome =>
  classifyRun({ kind: "ok", data: runHarness(level, readFixture(name)) }, level);
