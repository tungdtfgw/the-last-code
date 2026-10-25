import { spawnSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
import type { LevelDefinition } from "../../src/game/level-types";

// Every code example in a knowledge summary must run with real Python and print exactly
// its `output`. Real levels without a summary add nothing; the fixture keeps the check alive.

const DIRS = ["../../src/levels/", "../fixtures/levels/"].map((d) => new URL(d, import.meta.url));
const levels = DIRS.flatMap((dir) =>
  readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => ({ file: f, level: JSON.parse(readFileSync(new URL(f, dir), "utf8")) as LevelDefinition })),
);
const examples = levels.flatMap(({ file, level }) =>
  (level.knowledge_summary?.sections ?? [])
    .map((s, i) => ({ name: `${file} sections[${i}] "${s.heading}"`, code: s.code, output: s.output }))
    .filter((e): e is { name: string; code: string; output: string | undefined } => e.code !== undefined),
);

const trimLines = (text: string) =>
  text
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((l) => l.trimEnd())
    .join("\n")
    .replace(/\n+$/, "");

function runPython(code: string) {
  // -I: isolated mode, so nothing from the working directory or the environment is imported.
  const proc = spawnSync("python3", ["-I", "-"], { input: code, encoding: "utf8", timeout: 10_000 });
  if (proc.error) throw new Error(`python3 không chạy được (cần python3 trong PATH): ${proc.error.message}`);
  return proc;
}

describe("knowledge summary examples run as written", () => {
  test("the fixture contributes at least one example", () => {
    expect(examples.some((e) => e.name.startsWith("level-test-knowledge.json"))).toBe(true);
  });

  test.each(examples)("$name", ({ code, output }) => {
    const proc = runPython(code);
    // Section examples run cleanly; code that fails belongs in `mistakes`.
    expect(proc.stderr, "example raised an error").toBe("");
    expect(proc.status).toBe(0);
    if (output !== undefined) expect(trimLines(proc.stdout)).toBe(trimLines(output));
  });
});
