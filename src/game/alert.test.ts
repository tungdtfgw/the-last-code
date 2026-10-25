import { expect, test } from "vitest";
import { alertPercent, formatAlertPercent, fullAlertStatements, isCaught, isStealth } from "./alert";

test("8 statements is the 40% stealth limit (AC 12)", () => {
  expect(alertPercent(8, 8)).toBe(40);
  expect(alertPercent(20, 8)).toBe(100);
  expect(alertPercent(3, 8)).toBe(15);
  expect(fullAlertStatements(8)).toBe(20);
  expect(isStealth(8, 8)).toBe(true);
  expect(isStealth(9, 8)).toBe(false);
});

test("above 100% the Sentinel catches the run", () => {
  expect(isCaught(20, 8)).toBe(false);
  expect(isCaught(21, 8)).toBe(true);
  expect(formatAlertPercent(105)).toBe("100%+");
  // Odd limits: 100% = 12.5 statements, so 13 is caught and the bar shows > 100%.
  expect(isCaught(12, 5)).toBe(false);
  expect(isCaught(13, 5)).toBe(true);
  expect(alertPercent(13, 5)).toBeGreaterThan(100);
  expect(fullAlertStatements(5)).toBe(12);
  expect(formatAlertPercent(40)).toBe("40%");
});
