import { expect, test, type Page } from "./fixtures";
import { PYODIDE_MODULE_URL } from "../../src/engine/pyodide-config";
import { gotoLevel, replaceEditableCode, runAndWait, showTab, waitForPythonReady } from "./helpers";

// Level 1.6 played as GDD 1.6 §10 describes: starter code → 2 stars caught by the new questions → 3 stars → summary.

let online = true;
test.beforeAll(async () => {
  try {
    online = (await fetch(PYODIDE_MODULE_URL, { method: "HEAD" })).ok;
  } catch {
    online = false;
  }
});
test.beforeEach(() => test.skip(!online, "SKIP: offline (không tải được Pyodide từ cdn.jsdelivr.net)"));

/** Lines 1–5 (the locked profile and the comment) stay; bodies below replace line 6 to the end. */
const FROM_LINE = 6;
const TWO_STARS = ["ma_hoi = input()", 'print(f"DANH TINH: {ho_ten}")', 'print(f"MA DAP: {int(ma_hoi) + so_khu}")', 'print("CA DEM DA DUYET")', ""].join("\n");
const THREE_STARS = [
  "ma_hoi = int(input())",
  "ca = input()",
  'print(f"DANH TINH: {ho_ten}")',
  'print(f"MA DAP: {ma_hoi + so_khu}")',
  'print(f"CA {ca} DA DUYET")',
  "",
].join("\n");

const cards = (page: Page) => page.locator(".interrogation-card");

test("1.6: starter code breaks on line 8, two stars fall to the new questions, then three stars", async ({ page }) => {
  test.setTimeout(180_000);
  await gotoLevel(page, "1.6");
  const objectives = page.locator(".objective");
  await expect(objectives).toHaveCount(3);
  await waitForPythonReady(page);

  const terminal = page.locator(".terminal-scroll");

  // Run 1: the starter code reads one line, sends a wrong line 1, then breaks on line 8.
  await runAndWait(page);
  await expect(terminal).toContainText('> KÊNH NHẬP: "4172", "DEM" (đã đọc 1/2)');
  await expect(terminal).toContainText("> TRẠM BÁC: dòng 1 · sai ở vị trí 12");
  await expect(terminal).toContainText("> TRUY VẾT: dòng 8 — TypeError");
  await showTab(page, "Mô phỏng");
  await expect(cards(page)).toHaveCount(2);
  await expect(cards(page).nth(0)).toContainText("ĐÃ ĐỌC");
  await expect(cards(page).nth(1)).toContainText("CHƯA ĐỌC");

  // Run 2: the reference answer; the station half approves, then OMNI swaps the questions.
  await replaceEditableCode(page, TWO_STARS, FROM_LINE);
  await runAndWait(page);
  const dialog = page.locator("dialog[open]");
  await expect(dialog).toContainText("Trạm duyệt một nửa");
  await expect(dialog.locator(".star-row").first()).toHaveAttribute("aria-label", "2 trên 3 sao");
  await page.getByRole("button", { name: "Tối ưu tiếp" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(terminal).toContainText('"9035", "SANG"');

  // Run 3: both lines read, the answer holds against the new questions.
  await replaceEditableCode(page, THREE_STARS, FROM_LINE);
  await runAndWait(page);
  await expect(dialog).toContainText("Trạm duyệt hoàn toàn");
  await expect(dialog.locator(".star-row").first()).toHaveAttribute("aria-label", "3 trên 3 sao");
  await expect(dialog).toContainText("Đã thu: Lời đáp xác thực");
  await expect(terminal.locator(".term-line").last()).toHaveText("> TRẠM: MỞ HOÀN TOÀN");

  // TIẾP TỤC: the knowledge summary, whose stdin examples show their input.
  await dialog.getByRole("button", { name: "TIẾP TỤC" }).click();
  await expect(page).toHaveURL(/#\/learn\/1\.6$/);
  await expect(page.locator(".learn-screen")).toContainText("Dữ liệu nhập:");
});

test("1.6: a prompt goes out with the answer and is underlined in the station's list", async ({ page }) => {
  test.setTimeout(180_000);
  await gotoLevel(page, "1.6");
  await waitForPythonReady(page);
  await replaceEditableCode(page, THREE_STARS.replace("int(input())", 'int(input("Ma hoi: "))'), FROM_LINE);
  await runAndWait(page);
  await expect(page.locator(".terminal-scroll")).toContainText("nhận: Ma·hoi:·DANH·TINH");
  await showTab(page, "Mô phỏng");
  const row = page.locator(".relay-slot.has-prompt");
  await expect(row).toHaveCount(1);
  await expect(row).toContainText("dòng 1");
  await expect(row.locator(".interrogation-prompt")).not.toHaveCount(0);
});
