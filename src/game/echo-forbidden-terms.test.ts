import { expect, test } from "vitest";
import { renderTemplate } from "./echo-reactions";
import { getDefaultRegistry } from "./level-registry";

const SAMPLE = { line: 7, vars: "ma_xac_thuc, chi_so", error_type: "ValueError", count: 12 };
const FORBIDDEN = /\b(int|float|round)\b/i;

const levels = getDefaultRegistry().listLevels();

test("there is at least one registered level", () => {
  expect(levels.length).toBeGreaterThan(0);
});

test.each(levels.map((l) => [l.id, l] as const))(
  "level %s: no free ECHO reaction names a function or leaks an answer (AC 9)",
  (_id, level) => {
    const answers = new Set<string>();
    for (const t of [...level.tests, ...level.counter_attack_tests]) {
      for (const v of Object.values(t.expected)) {
        answers.add(String(v));
        if (typeof v === "boolean") answers.add(v ? "True" : "False");
      }
    }
    for (const [key, template] of Object.entries(level.reactions)) {
      const text = renderTemplate(template!, SAMPLE);
      expect(text, key).not.toMatch(FORBIDDEN);
      for (const answer of answers) {
        // Match the answer as a standalone token, not inside an unrelated number.
        const re = new RegExp(`(^|[^\\w.])${answer.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}($|[^\\w])`, "i");
        expect(text, `${key} leaks ${answer}`).not.toMatch(re);
      }
    }
  },
);
