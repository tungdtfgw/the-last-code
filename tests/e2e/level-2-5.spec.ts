import { expect, test, type Page } from "./fixtures";
import { PYODIDE_MODULE_URL } from "../../src/engine/pyodide-config";
import { realLevelJson } from "../content-fixture";
import { continueFromResults, gotoLevel, replaceEditableCode, runAndWait, showTab, waitForPythonReady } from "./helpers";

// Level 2.5 end to end (real Pyodide): the starter takes the wrong branch in situation 2
// and dims the else body, the fixed condition earns three stars, the summary leads to
// after-2.5 and its rule card.

let online = true;
test.beforeAll(async () => {
  try {
    const res = await fetch(PYODIDE_MODULE_URL, { method: "HEAD" });
    online = res.ok;
  } catch {
    online = false;
  }
});
test.beforeEach(() => test.skip(!online, "SKIP: offline (không tải được Pyodide từ cdn.jsdelivr.net)"));

/** Editable code from line 6 (the comment under the locked sensors), as in `three-star.py`. */
const FROM_LINE = 6;
const SOLUTION_3_STARS = [
  "# Kai được qua khi drone ở xa hoặc camera tắt, và đèn pha không chiếu",
  "if (khoang_cach > 40 or not camera_bat) and not den_pha:",
  '    print("LENH: QUA")',
  "else:",
  '    print("LENH: CHO")',
].join("\n");

const terminal = (page: Page) => page.locator(".terminal-scroll");

test("starter takes the wrong branch in situation 2, the fixed condition opens the crossing", async ({ page }) => {
  test.setTimeout(240_000);
  const text = realLevelJson("2.5");

  await gotoLevel(page, "2.5");
  await waitForPythonReady(page);

  await runAndWait(page);
  await expect(terminal(page)).toContainText("TÌNH HUỐNG 2/4");
  await expect(terminal(page)).toContainText("KHÔNG CHẠY Ở TÌNH HUỐNG 2: dòng 10");
  await showTab(page, "Mã");
  await expect(page.locator(".cm-skipped-line")).toHaveCount(1);

  await replaceEditableCode(page, SOLUTION_3_STARS, FROM_LINE);
  await runAndWait(page);
  const dialog = page.locator("dialog[open]");
  await expect(dialog.locator(".results-stars .star-row").first()).toHaveAttribute("aria-label", "3 trên 3 sao");
  await expect(dialog).toContainText(`Đã thu: ${text.component}`);

  await continueFromResults(page, "2.5");
  await expect(page).toHaveURL(/#\/story\/after-2\.5$/);
  await expect(page.locator(".story [aria-live]")).toHaveText(text.outro);

  // Step through the outro and the lore fragment to the rule card.
  const card = page.locator(".beat-card-text");
  for (let i = 0; i < 12 && !(await card.isVisible()); i++) {
    await page.keyboard.press("Space");
    await page.waitForTimeout(150);
  }
  await expect(card).toContainText("BỘ LUẬT NÉ · LUẬT 5/6");
});
