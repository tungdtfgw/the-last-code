import { expect, test } from "vitest";
import { echoLineLeaks } from "./echo-line-check";
import { realRegistry } from "../../tests/content-fixture";

// The text the game plays: the puzzle files plus the text from the migrations.
const levels = realRegistry().listLevels();

test("there is at least one registered level", () => {
  expect(levels.length).toBeGreaterThan(0);
});

// Free ECHO lines only; hints may name anything.
test.each(levels.map((l) => [l.id, l] as const))(
  "level %s: no free ECHO line uses a forbidden term or leaks an answer (AC 9)",
  (_id, level) => {
    expect(echoLineLeaks(level)).toEqual([]);
  },
);
