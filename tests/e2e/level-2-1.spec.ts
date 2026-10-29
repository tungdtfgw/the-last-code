import { expect, test } from "./fixtures";
import { PYODIDE_MODULE_URL } from "../../src/engine/pyodide-config";
import { realLevelJson } from "../content-fixture";
import { continueFromResults, gotoLevel, replaceEditableCode, runAndWait, waitForPythonReady } from "./helpers";

// Level 2.1 played as GDD 2.1 §13 describes: starter code breaks on line 10 → three flags right → summary → after-2.1.

let online = true;
test.beforeAll(async () => {
  try {
    online = (await fetch(PYODIDE_MODULE_URL, { method: "HEAD" })).ok;
  } catch {
    online = false;
  }
});
test.beforeEach(() => test.skip(!online, "SKIP: offline (không tải được Pyodide từ cdn.jsdelivr.net)"));

const level = realLevelJson("2.1");

/** Lines 1–7 (the locked sensors and the comments) stay; the three flags replace line 8 to the end. */
const FROM_LINE = 8;
const THREE_STARS = ["trong_tam = khoang_cach <= tam_quet", 'dang_quet = che_do == "QUET"', "het_pin = pin < 20", ""].join("\n");

test("2.1: starter code breaks on line 10, three comparisons win three stars, then the summary and the story", async ({ page }) => {
  test.setTimeout(180_000);
  await gotoLevel(page, "2.1");
  await expect(page.locator(".objective")).toHaveCount(3);
  await waitForPythonReady(page);

  const terminal = page.locator(".terminal-scroll");

  // Run 1: the starter code compares a number with the string "20".
  await runAndWait(page);
  await expect(terminal).toContainText("> TRUY VẾT: dòng 10 — TypeError");

  // Run 2: one comparison per flag holds against OMNI's new readings.
  await replaceEditableCode(page, THREE_STARS, FROM_LINE);
  await runAndWait(page);
  const dialog = page.locator("dialog[open]");
  await expect(dialog.locator(".star-row").first()).toHaveAttribute("aria-label", "3 trên 3 sao");
  await expect(dialog).toContainText(`Đã thu: ${level.component}`);

  // TIẾP TỤC: knowledge summary, then the story after 2.1.
  await continueFromResults(page, "2.1");
  await expect(page).toHaveURL(/#\/story\/after-2\.1$/);
});
