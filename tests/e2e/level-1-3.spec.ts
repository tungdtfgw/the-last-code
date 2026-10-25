import { expect, test, type Page } from "@playwright/test";
import { PYODIDE_MODULE_URL } from "../../src/engine/pyodide-config";
import { L13_FROM_LINE, L13_SOLUTION_3_STARS, enterMission, replaceEditableCode, runAndWait, waitForPythonReady, continueFromResults } from "./helpers";

// Level 1.3 played as GDD 1.3 §12 describes: gate → solution → 3 stars → after-1.3 → the 1.4 gate.

let online = true;
test.beforeAll(async () => {
  try {
    online = (await fetch(PYODIDE_MODULE_URL, { method: "HEAD" })).ok;
  } catch {
    online = false;
  }
});
test.beforeEach(() => test.skip(!online, "SKIP: offline (không tải được Pyodide từ cdn.jsdelivr.net)"));

type Probe = { event: string }[];
const events = (page: Page) =>
  page.evaluate(() => (window as unknown as { __TLC_AUDIO_PROBE__: Probe }).__TLC_AUDIO_PROBE__.map((e) => e.event));

test("1.3: asking the session code its shape clears the sorter, 3 stars, after-1.3 leads to the 1.4 gate", async ({ page }) => {
  test.setTimeout(180_000);
  await page.addInitScript(() => {
    (window as unknown as { __TLC_AUDIO_PROBE__: Probe }).__TLC_AUDIO_PROBE__ = [];
  });
  // Locked on the map until 1.2 has a star, but the link still opens it.
  await page.goto("/#/level/1.3");
  await expect(page.locator(".intro-gate")).toContainText("Ga Ngầm Số 3");
  await enterMission(page);
  await expect(page.locator(".objective")).toHaveCount(5);
  await waitForPythonReady(page);

  await replaceEditableCode(page, L13_SOLUTION_3_STARS, L13_FROM_LINE);
  await runAndWait(page);
  const dialog = page.locator("dialog[open]");
  await expect(dialog).toContainText("Rào mở hoàn toàn");
  await expect(dialog.locator(".star-row").first()).toHaveAttribute("aria-label", "3 trên 3 sao");
  await expect(dialog).toContainText("Đã thu: Khuôn kiểu");
  await expect(page.locator(".terminal-scroll")).toContainText('> ma_phien = "7351"');
  // The mould stamp followed the session code into its new shape (text is there behind the dialog and phone tabs).
  await expect(page.getByTestId("sorter")).toContainText("KHỚP KHUÔN");
  expect(await events(page)).toEqual(expect.arrayContaining(["siren", "gate_open", "star"]));

  await continueFromResults(page, "1.3");
  await expect(page).toHaveURL(/#\/story\/after-1\.3$/);
  await expect(page.locator(".story [aria-live]")).toHaveText(
    "Máy quét chuyển xanh. Trong nhật ký hiệu chỉnh của nó, giữa hàng nghìn dòng số, có một dòng chữ:",
  );
  await expect(page.getByRole("button", { name: /BỎ QUA/ })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page).toHaveURL(/#\/level\/1\.4$/);
  await expect(page.getByRole("button", { name: "VÀO NHIỆM VỤ" })).toBeVisible();
});
