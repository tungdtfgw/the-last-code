import { readFileSync } from "node:fs";
import { expect, test, type Page } from "./fixtures";
import { PYODIDE_MODULE_URL } from "../../src/engine/pyodide-config";
import { realLevelJson } from "../content-fixture";
import { editorText, gotoLevel, replaceEditableCode, runAndWait, showTab, waitForPythonReady } from "./helpers";

// Level 2.6 end to end (real Pyodide), the first level with no locked line: starter code →
// TypeError → wrong decision in situation 4 with dimmed lines → reset → three stars →
// summary → after-2.6. GDD 2.6 §5, §11, §14.

let online = true;
test.beforeAll(async () => {
  try {
    online = (await fetch(PYODIDE_MODULE_URL, { method: "HEAD" })).ok;
  } catch {
    online = false;
  }
});
test.beforeEach(() => test.skip(!online, "SKIP: offline (không tải được Pyodide từ cdn.jsdelivr.net)"));

const level = realLevelJson("2.6");
const STARTER = level.starter_code.replace(/\n$/, "");
const THREE_STARS = readFileSync(new URL("../fixtures/solutions/2.6/three-star.py", import.meta.url), "utf8");
/** Line 3 of the starter onward, with the battery read as a number. */
const FROM_LINE_3 = STARTER.split("\n").slice(2).join("\n").replace("pin = input()", "pin = int(input())");

/** Wait for a run started by a click to finish playing (run button back to CHẠY, or a results dialog). */
async function waitRunDone(page: Page) {
  await page.waitForFunction(
    () => {
      const btn = document.querySelector<HTMLButtonElement>('[data-testid="run-button"]');
      return !!document.querySelector("dialog[open]") || (btn?.querySelector("span")?.textContent === "CHẠY" && btn.getAttribute("aria-disabled") !== "true");
    },
    null,
    { timeout: 60_000 },
  );
}

const terminal = (page: Page) => page.locator(".terminal-scroll");
const sensorValues = (page: Page) => page.locator(".patrol-sensor.is-stdin .patrol-sensor-value");

test("2.6: no locked line, starter TypeError, situation 4 caught with dimmed lines, reset, then three stars", async ({ page }) => {
  test.setTimeout(240_000);
  await gotoLevel(page, "2.6");
  await waitForPythonReady(page);

  // The editor holds the starter code, and no line is locked.
  expect(await editorText(page)).toBe(STARTER);
  await expect(page.locator(".cm-content .cm-locked-line")).toHaveCount(0);

  // Run 1: both stdin lines read, then the comparison of text with a number fails on line 5.
  await runAndWait(page);
  await expect(terminal(page)).toContainText('KÊNH NHẬP: "XUAT KICH", "80" (đã đọc 2/2)');
  await expect(terminal(page)).toContainText("TypeError");
  await showTab(page, "Mô phỏng");
  await expect(sensorValues(page)).toHaveCount(2);

  // Run 2: the battery as a number; situation 4 gets another situation's decision.
  await replaceEditableCode(page, FROM_LINE_3, 3);
  await page.getByTestId("run-button").click();
  await showTab(page, "Mô phỏng");
  // Situation 2 sends an empty command line: an empty, labelled card, never hidden.
  const empty = page.locator(".patrol-sensor.is-stdin.is-empty");
  await expect(empty).toHaveCount(1, { timeout: 30_000 });
  await expect(empty.locator(".patrol-sensor-value")).toHaveText("(dòng trống)");
  await waitRunDone(page);
  await expect(terminal(page)).toContainText("> KHÔNG CHẠY Ở TÌNH HUỐNG 4: dòng 7, 8, 10");
  await showTab(page, "Mã");
  await expect(page.locator(".cm-content .cm-skipped-line")).toHaveCount(3);

  // Reset: back to the starter code, typing works from line 1 (no locked block to skip).
  await page.getByRole("button", { name: "Khôi phục mã gốc" }).click();
  await page.getByRole("button", { name: "Xác nhận khôi phục" }).click();
  await expect(terminal(page)).toContainText("Đã khôi phục mã gốc.");
  expect(await editorText(page)).toBe(STARTER);
  await page.locator(".cm-content .cm-line").first().click({ position: { x: 2, y: 5 } });
  await page.keyboard.press("ControlOrMeta+Home");
  await page.keyboard.insertText("# ");
  expect((await editorText(page)).split("\n")[0]).toBe(`# ${STARTER.split("\n")[0]}`);

  // Run 3: the nested answer from line 1. OMNI's third new situation sends a lone space,
  // shown as `·`, unlike the empty line.
  await replaceEditableCode(page, THREE_STARS.replace(/\n$/, ""), 1);
  await page.getByTestId("run-button").click();
  await showTab(page, "Mô phỏng");
  await expect(sensorValues(page).filter({ hasText: /^·$/ })).toHaveCount(1, { timeout: 60_000 });
  const dialog = page.locator("dialog[open]");
  await expect(dialog).toBeVisible({ timeout: 60_000 });
  await expect(dialog).toContainText("Lối qua mở hoàn toàn");
  await expect(dialog.locator(".star-row").first()).toHaveAttribute("aria-label", "3 trên 3 sao");
  await expect(dialog).toContainText("Đã thu: Đọc bảng lệnh");

  // TIẾP TỤC: the summary (its stdin examples show their input, the empty line too), then after-2.6.
  await dialog.getByRole("button", { name: "TIẾP TỤC" }).click();
  await expect(page).toHaveURL(/#\/learn\/2\.6$/);
  const summary = page.locator(".learn-screen");
  await expect(summary).toContainText("Dữ liệu nhập:");
  await expect(summary).toContainText("Chua nhap ten");
  await expect(summary.getByRole("button", { name: "TIẾP TỤC" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#\/story\/after-2\.6$/);
  const story = page.locator(".story");
  await expect(async () => {
    if (!(await story.textContent())?.includes("BỘ LUẬT NÉ · LUẬT 6/6")) await page.keyboard.press("Space");
    await expect(story).toContainText("BỘ LUẬT NÉ · LUẬT 6/6", { timeout: 500 });
  }).toPass({ timeout: 30_000 });
});

// The GDD (§5) asks the sensor board to mark each stdin card read / unread from
// `stdinRead`, like the interrogation scene. The patrol scene does not draw that state yet;
// enable this once the shared simulation does.
test.fixme("2.6: stdin cards show read and unread", async ({ page }) => {
  await gotoLevel(page, "2.6");
  await waitForPythonReady(page);
  await runAndWait(page);
  await showTab(page, "Mô phỏng");
  await expect(page.locator(".patrol-sensors")).toContainText("ĐÃ ĐỌC");
});
