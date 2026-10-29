import { expect, test } from "./fixtures";
import { PYODIDE_MODULE_URL } from "../../src/engine/pyodide-config";
import { realLevelJson } from "../content-fixture";
import { continueFromResults, gotoLevel, replaceEditableCode, runAndWait, waitForPythonReady } from "./helpers";

// Level 2.4 played as GDD 2.4 §13 describes: the reversed ladder → right order with the `<=` left
// at 50 (2 stars, caught at 50 m) → 3 stars → summary → after-2.4.

let online = true;
test.beforeAll(async () => {
  try {
    online = (await fetch(PYODIDE_MODULE_URL, { method: "HEAD" })).ok;
  } catch {
    online = false;
  }
});
test.beforeEach(() => test.skip(!online, "SKIP: offline (không tải được Pyodide từ cdn.jsdelivr.net)"));

/** Lines 1–4 (the locked distance and the comments) stay; bodies below replace line 5 to the end. */
const FROM_LINE = 5;
const ladder = (middle: string) =>
  [
    "if khoang_cach < 20:",
    '    print("MUC: BAO DONG")',
    `elif khoang_cach ${middle} 50:`,
    '    print("MUC: NGUY HIEM")',
    "elif khoang_cach < 100:",
    '    print("MUC: CANH GIAC")',
    "else:",
    '    print("MUC: AN TOAN")',
    "",
  ].join("\n");
const TWO_STARS = ladder("<=");
const THREE_STARS = ladder("<");

test("2.4: the reversed ladder stops at its first branch, the `<=` falls at 50 m, then three stars", async ({ page }) => {
  test.setTimeout(180_000);
  await gotoLevel(page, "2.4");
  await waitForPythonReady(page);
  const terminal = page.locator(".terminal-scroll");

  // Run 1: situation 1 gets the level of situation 3; only lines 5 and 6 ran.
  await runAndWait(page);
  await expect(terminal).toContainText("> DRONE PHÁT HIỆN: dòng 1 · sai ở vị trí 6");
  await expect(terminal).toContainText("> KHÔNG CHẠY Ở TÌNH HUỐNG 1: dòng 7, 8, 9, 10, 12");

  // Run 2: right order, `<=` still at 50: the base passes, the counter-attack at 50 m does not.
  await replaceEditableCode(page, TWO_STARS, FROM_LINE);
  await runAndWait(page);
  const dialog = page.locator("dialog[open]");
  await expect(dialog).toContainText("Lối qua mở một nửa");
  await expect(dialog.locator(".star-row").first()).toHaveAttribute("aria-label", "2 trên 3 sao");
  await page.getByRole("button", { name: "Tối ưu tiếp" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(terminal).toContainText("> khoang_cach = 50");

  // Run 3: `<` at every mark.
  await replaceEditableCode(page, THREE_STARS, FROM_LINE);
  await runAndWait(page);
  await expect(dialog).toContainText("Lối qua mở hoàn toàn");
  await expect(dialog.locator(".star-row").first()).toHaveAttribute("aria-label", "3 trên 3 sao");
  await expect(dialog).toContainText(`Đã thu: ${realLevelJson("2.4").component}`);

  // TIẾP TỤC: the knowledge summary, then the story after the level.
  await continueFromResults(page, "2.4");
  await expect(page).toHaveURL(/#\/story\/after-2\.4$/);
});
