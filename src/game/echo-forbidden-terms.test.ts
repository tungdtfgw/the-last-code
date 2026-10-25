import { expect, test } from "vitest";
import { findEchoLeak, levelLeaks } from "./echo-leaks";
import { renderTemplate } from "./echo-reactions";
import { getDefaultRegistry } from "./level-registry";

const SAMPLE = { line: 7, vars: "ma_xac_thuc, chi_so", error_type: "ValueError", count: 12, out_line: 2, col: 6 };

const levels = getDefaultRegistry().listLevels();

test("there is at least one registered level", () => {
  expect(levels.length).toBeGreaterThan(0);
});

// Free ECHO lines only; hints may name anything.
test.each(levels.map((l) => [l.id, l] as const))(
  "level %s: no free ECHO line uses a forbidden term or leaks an answer (AC 9)",
  (_id, level) => {
    const leaks = levelLeaks(level);
    for (const [key, template] of Object.entries(level.reactions)) {
      expect(findEchoLeak(renderTemplate(template!, SAMPLE), leaks), key).toBeNull();
    }
    for (const [key, template] of Object.entries(level.reaction_variants ?? {})) {
      expect(findEchoLeak(renderTemplate(template!, SAMPLE), leaks), `reaction_variants.${key}`).toBeNull();
    }
    (level.outro_beats ?? []).forEach((beat, i) => {
      if (beat.kind === "echo") expect(findEchoLeak(beat.text, leaks), `outro_beats[${i}]`).toBeNull();
    });
  },
);
