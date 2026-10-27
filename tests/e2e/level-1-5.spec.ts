import { expect, test, type Page } from "./fixtures";
import { PYODIDE_MODULE_URL } from "../../src/engine/pyodide-config";
import { realLevelJson } from "../content-fixture";
import { continueFromResults, enterMission, replaceEditableCode, runAndWait, waitForPythonReady } from "./helpers";

// Level 1.5 played as GDD 1.5 §10 describes: starter code → wrong shapes on the rack → 3-star split → summary → after-1.5.

let online = true;
test.beforeAll(async () => {
  try {
    online = (await fetch(PYODIDE_MODULE_URL, { method: "HEAD" })).ok;
  } catch {
    online = false;
  }
});
test.beforeEach(() => test.skip(!online, "SKIP: offline (không tải được Pyodide từ cdn.jsdelivr.net)"));

const text = realLevelJson("1.5");
/** Editable part from line 7 on (the comment above the energy line), same layout as the starter code. */
const FROM_LINE = 7;
const SOLUTION_3_STARS = [
  "# Năng lượng cần = số đoạn × điện áp mũ 2 − phần dự trữ",
  "nang_luong = so_doan * dien_ap ** 2 - du_tru",
  "",
  "# Số pin đầy, và phần lẻ rút từ một pin nữa",
  "so_pin = nang_luong // dung_luong",
  "phan_le = nang_luong % dung_luong",
].join("\n");

type Probe = { event: string }[];
const events = (page: Page) =>
  page.evaluate(() => (window as unknown as { __TLC_AUDIO_PROBE__: Probe }).__TLC_AUDIO_PROBE__.map((e) => e.event));

test("1.5: starter code is refused by the rack, the quotient and remainder turn the fence off, 3 stars, summary, after-1.5", async ({ page }) => {
  test.setTimeout(180_000);
  await page.addInitScript(() => {
    (window as unknown as { __TLC_AUDIO_PROBE__: Probe }).__TLC_AUDIO_PROBE__ = [];
  });
  await page.goto("/#/level/1.5");
  await expect(page.locator(".intro-gate")).toContainText(text.location);
  await enterMission(page);
  await expect(page.locator(".objective")).toHaveCount(3);
  await waitForPythonReady(page);

  // Starter code: no traceback, the cells are the wrong shape and the energy is negative.
  await runAndWait(page);
  const terminal = page.locator(".terminal-scroll");
  await expect(terminal).toContainText("so_pin: float, yêu cầu int");
  await expect(terminal).not.toContainText("TRUY VẾT");
  await expect(page.getByTestId("fence")).toContainText("NĂNG LƯỢNG ÂM");
  await expect(page.getByTestId("fence")).toContainText("PIN KHÔNG CẮT ĐƯỢC");
  await expect(page.locator(".echo-live")).toContainText(text.reactions.type_mismatch.replace("{vars}", "so_pin, phan_le"));

  await replaceEditableCode(page, SOLUTION_3_STARS, FROM_LINE);
  await runAndWait(page);
  const dialog = page.locator("dialog[open]");
  await expect(dialog).toContainText("Rào tắt hoàn toàn");
  await expect(dialog.locator(".star-row").first()).toHaveAttribute("aria-label", "3 trên 3 sao");
  await expect(dialog).toContainText(`Đã thu: ${text.component}`);
  await expect(terminal).toContainText("> so_doan = 7   dien_ap = 15   du_tru = 75   dung_luong = 110");
  await expect(page.getByTestId("fence")).toContainText("RÀO TẮT HOÀN TOÀN");
  expect(await events(page)).toEqual(expect.arrayContaining(["siren", "gate_open", "star"]));

  await continueFromResults(page, "1.5");
  await expect(page).toHaveURL(/#\/story\/after-1\.5$/);
  await expect(page.locator(".story [aria-live]")).toHaveText(text.outro);
});
