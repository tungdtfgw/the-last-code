import { expect, test, type Page } from "./fixtures";
import { PYODIDE_MODULE_URL } from "../../src/engine/pyodide-config";
import { realChapterJson, realLevelJson } from "../content-fixture";
import { continueFromResults, gotoLevel, replaceEditableCode, runAndWait, showTab, waitForPythonReady } from "./helpers";

// Boss 1.7 end to end (real Pyodide): starter code → three stars → chapter summary →
// after-1.7 → the end of chapter 1 → map. Written for the full chapter (seven levels).

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

/** Editable code from line 8 (after the locked session data and its comment). */
const FROM_LINE = 8;
const SOLUTION_3_STARS = [
  "ma_hoi = int(input())",
  "muc = int(float(input()))",
  "",
  'print("NID/2089")',
  'print(f"HO SO: {ho_ten} / {ma_khu}")',
  'print("KHUON:", type(ma_phien))',
  'print(f"SINH TRAC: {round(float(chieu_cao) * 2, 2)}")',
  'print(f"NANG LUONG: {muc // 100} PIN + {muc % 100}")',
  'print(f"LOI DAP: {ma_hoi + 7}")',
].join("\n");

const terminal = (page: Page) => page.locator(".terminal-scroll");

test("boss: starter code breaks in round 1, the solution opens the gate, the chapter ends on the map", async ({ page }) => {
  test.setTimeout(240_000);
  const level = realLevelJson("1.7");
  const teaser = realChapterJson().teaser as { text: string }[];

  await gotoLevel(page, "1.7");
  await waitForPythonReady(page);

  await runAndWait(page);
  await expect(terminal(page)).toContainText("VÒNG QUÉT 1/3");
  await expect(terminal(page)).toContainText("TRUY VẾT: dòng 15 — TypeError");
  await expect(terminal(page)).not.toContainText("VÒNG QUÉT 2/3");
  await showTab(page, "Mô phỏng");
  await expect(page.locator(".checkpoint-ring.is-rejected")).toHaveCount(1);
  await expect(page.locator(".checkpoint-ring.is-notReached")).toHaveCount(2);

  await replaceEditableCode(page, SOLUTION_3_STARS, FROM_LINE);
  await runAndWait(page);
  const dialog = page.locator("dialog[open]");
  await expect(dialog.locator(".results-stars .star-row").first()).toHaveAttribute("aria-label", "3 trên 3 sao");
  // The boss builds no component.
  await expect(dialog).not.toContainText("Đã thu");
  await continueFromResults(page, "1.7");

  await expect(page).toHaveURL(/#\/story\/after-1\.7$/);
  await expect(page.locator(".story [aria-live]")).toHaveText(level.outro);
  await page.keyboard.press("Escape");

  await expect(page).toHaveURL(/#\/story\/teaser$/);
  await expect(page.locator(".story [aria-live]")).toContainText(teaser[0].text);
  await page.keyboard.press("Escape");
  const toMap = page.getByRole("button", { name: "VỀ BẢN ĐỒ" });
  await expect(toMap).toBeFocused();
  await page.keyboard.press("Enter");

  await expect(page).toHaveURL(/#\/map$/);
  await expect(page.getByTestId("chapter-stars")).toHaveText(/\/21$/);
  await expect(page.getByRole("button", { name: "Hết chương 1" })).toBeVisible();
});
