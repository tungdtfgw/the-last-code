import { expect, test } from "vitest";
import { computeStars } from "./compute-stars";

const base = { basePassed: true, statementCount: 3, limit: 8, hasCounter: true, counterSurvived: true };

test("stars are cumulative", () => {
  expect(computeStars({ ...base, basePassed: false })).toBe(0);
  expect(computeStars(base)).toBe(3);
  expect(computeStars({ ...base, counterSurvived: false })).toBe(2);
  expect(computeStars({ ...base, statementCount: 9 })).toBe(1);
  expect(computeStars({ ...base, statementCount: 9, counterSurvived: false })).toBe(1);
  expect(computeStars({ ...base, hasCounter: false, counterSurvived: false })).toBe(2);
});

test("over 100% alert is caught: 0 stars even when correct", () => {
  expect(computeStars({ ...base, statementCount: 21 })).toBe(0);
  expect(computeStars({ ...base, statementCount: 20 })).toBe(1);
});
