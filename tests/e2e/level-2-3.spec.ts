import { expect, test } from "./fixtures";
import { realLevelJson } from "../content-fixture";
import { PYODIDE_MODULE_URL } from "../../src/engine/pyodide-config";
import { continueFromResults, gotoLevel, replaceEditableCode, runAndWait, waitForPythonReady } from "./helpers";

// Level 2.3 played as GDD 2.3 §5.1 and §13 describe: the starter misses the angle line in
// situation 1, the dedented line leaves a gap at the boundary (situation 3), `else` closes it.

let online = true;
test.beforeAll(async () => {
  try {
    online = (await fetch(PYODIDE_MODULE_URL, { method: "HEAD" })).ok;
  } catch {
    online = false;
  }
});
test.beforeEach(() => test.skip(!online, "SKIP: offline (không tải được Pyodide từ cdn.jsdelivr.net)"));

const level = realLevelJson("2.3") as { component: string };

/** Lines 1–4 (the locked angle and the comments) stay; bodies below replace line 5 to the end. */
const FROM_LINE = 5;
const DEDENTED = [
  "if goc_den < 90:",
  '    huong = "SANG PHAI"',
  "if goc_den > 90:",
  '    huong = "SANG TRAI"',
  'print(f"GOC DEN: {goc_den}")',
  "",
].join("\n");
const THREE_STARS = [
  "if goc_den < 90:",
  '    huong = "SANG PHAI"',
  "else:",
  '    huong = "SANG TRAI"',
  'print(f"GOC DEN: {goc_den}")',
  "",
].join("\n");

test("2.3: the angle line inside a block, then the gap at the boundary, then else for three stars", async ({ page }) => {
  test.setTimeout(180_000);
  await gotoLevel(page, "2.3");
  await expect(page.locator(".objective")).toHaveCount(2);
  await waitForPythonReady(page);
  const terminal = page.locator(".terminal-scroll");

  // Run 1: the starter code; situation 1 decides right but never logs the angle.
  await runAndWait(page);
  await expect(terminal).toContainText("> KHÔNG CHẠY Ở TÌNH HUỐNG 1: dòng 8, 9");

  // Run 2: the angle line after the block; at the boundary neither assignment runs.
  await replaceEditableCode(page, DEDENTED, FROM_LINE);
  await runAndWait(page);
  await expect(terminal).toContainText("> KHÔNG CHẠY Ở TÌNH HUỐNG 3: dòng 6, 8");
  await expect(page.locator(".cm-skipped-line")).toHaveCount(2);

  // Run 3: one check and else.
  await replaceEditableCode(page, THREE_STARS, FROM_LINE);
  await runAndWait(page);
  const dialog = page.locator("dialog[open]");
  await expect(dialog.locator(".star-row").first()).toHaveAttribute("aria-label", "3 trên 3 sao");
  await expect(dialog).toContainText(`Đã thu: ${level.component}`);

  // TIẾP TỤC: the knowledge summary, then the story after the level.
  await continueFromResults(page, "2.3");
  await expect(page).toHaveURL(/#\/story\/after-2\.3$/);
});
