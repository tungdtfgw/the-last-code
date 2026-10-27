import { expect, test, type Page } from "./fixtures";
import { PYODIDE_MODULE_URL } from "../../src/engine/pyodide-config";
import { L12_FROM_LINE, L12_SOLUTION_3_STARS, enterMission, replaceEditableCode, runAndWait, waitForPythonReady, continueFromResults } from "./helpers";

// Level 1.2 played as GDD 1.2 §14 describes: gate → starter code (NameError, line 13) → solution → 3 stars → transition.

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

test("1.2: starter code breaks on line 13, the solution clears every cell, 3 stars, after-1.2 leads to 1.3", async ({ page }) => {
  test.setTimeout(180_000);
  await page.addInitScript(() => {
    (window as unknown as { __TLC_AUDIO_PROBE__: Probe }).__TLC_AUDIO_PROBE__ = [];
  });
  await page.goto("/#/level/1.2");
  await expect(page.locator(".intro-gate")).toContainText("Trạm Phát Khẩu Phần số 4");
  await enterMission(page);
  await expect(page.locator(".objective")).toHaveCount(6);
  await waitForPythonReady(page);

  const terminal = page.locator(".terminal-scroll");
  const kiosk = page.getByTestId("kiosk");

  // Run 1: the starter code as given.
  await runAndWait(page);
  await expect(terminal).toContainText("> TRUY VẾT: dòng 13 — NameError");
  await expect(kiosk.locator('[data-slot="the_quet"]')).toHaveAttribute("data-verdict", "");

  // Run 2: buffer labelled, log copied before the reassignment, devices read last.
  await replaceEditableCode(page, L12_SOLUTION_3_STARS, L12_FROM_LINE);
  await runAndWait(page);
  const dialog = page.locator("dialog[open]");
  await expect(dialog).toContainText("Cổng khu mở hoàn toàn");
  await expect(dialog.locator(".star-row").first()).toHaveAttribute("aria-label", "3 trên 3 sao");
  await expect(dialog).toContainText("Đã thu: Hồ sơ danh tính");
  const slots = kiosk.locator("[data-slot]");
  await expect(slots).toHaveCount(6);
  for (const slot of await slots.all()) await expect(slot).toHaveAttribute("data-verdict", "ok");
  expect(await events(page)).toEqual(expect.arrayContaining(["siren", "gate_open", "star"]));

  await continueFromResults(page, "1.2");
  await expect(page).toHaveURL(/#\/story\/after-1\.2$/);
  await expect(page.locator(".story [aria-live]")).toHaveText("Ki-ốt nhận hồ sơ của ĐỖ MINH AN. Trong nhật ký quản trị của nó có một dòng không thuộc về OMNI:");
  // The transition leads on to 1.3.
  await expect(page.getByRole("button", { name: /BỎ QUA/ })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page).toHaveURL(/#\/level\/1\.3$/);
  await expect(page.locator(".intro-gate")).toContainText("Ga Ngầm Số 3");
});
