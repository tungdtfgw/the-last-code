import { expect, test } from "./fixtures";
import { PYODIDE_MODULE_URL } from "../../src/engine/pyodide-config";
import { realLevelJson } from "../content-fixture";
import { continueFromResults, gotoLevel, replaceEditableCode, runAndWait, showTab, waitForPythonReady } from "./helpers";

// Level 2.2 played as GDD 2.2 §13 describes: the starter code's IndentationError, the dimmed
// line that shows the if block never ran in situation 1, then three stars and the summary.

let online = true;
test.beforeAll(async () => {
  try {
    online = (await fetch(PYODIDE_MODULE_URL, { method: "HEAD" })).ok;
  } catch {
    online = false;
  }
});
test.beforeEach(() => test.skip(!online, "SKIP: offline (không tải được Pyodide từ cdn.jsdelivr.net)"));

/** Lines 1–5 (the locked sensors and the comment) stay; bodies below replace line 6 to the end. */
const FROM_LINE = 6;
const body = (condition: string) => ['lenh = "DI"', `if ${condition}:`, '    lenh = "NAP"', ""].join("\n");

test("2.2: indentation error, a dimmed line in situation 1, then three stars", async ({ page }) => {
  test.setTimeout(180_000);
  const level = realLevelJson("2.2");
  await gotoLevel(page, "2.2");
  await waitForPythonReady(page);
  const terminal = page.locator(".terminal-scroll");
  const dimmed = page.locator(".cm-content .cm-line.cm-skipped-line");

  // Run 1: the body under the if is not indented.
  await runAndWait(page);
  await expect(terminal).toContainText("> TRUY VẾT: dòng 8 — IndentationError");
  await expect(dimmed).toHaveCount(0);

  // Run 2: indented, but the condition asks for "out of range": the block never runs in situation 1.
  await replaceEditableCode(page, body("khoang_cach > tam_quet"), FROM_LINE);
  await runAndWait(page);
  await expect(terminal).toContainText("KHÔNG CHẠY Ở TÌNH HUỐNG 1: dòng 8");
  await showTab(page, "Mã");
  await expect(dimmed).toHaveCount(1);
  await expect(dimmed).toContainText('lenh = "NAP"');

  // Any edit clears the dimming.
  await dimmed.click();
  await page.keyboard.press("End");
  await page.keyboard.type(" ");
  await expect(dimmed).toHaveCount(0);

  // Run 3: the edge included.
  await replaceEditableCode(page, body("khoang_cach <= tam_quet"), FROM_LINE);
  await runAndWait(page);
  const dialog = page.locator("dialog[open]");
  await expect(dialog.locator(".star-row").first()).toHaveAttribute("aria-label", "3 trên 3 sao");
  await expect(dialog).toContainText(`Đã thu: ${level.component}`);

  // TIẾP TỤC: the knowledge summary, then the story after the level.
  await continueFromResults(page, "2.2");
  await expect(page).toHaveURL(/#\/story\/after-2\.2$/);
});
