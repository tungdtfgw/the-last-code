import { expect, test, type Page } from "@playwright/test";
import { PYODIDE_MODULE_URL } from "../../src/engine/pyodide-config";
import {
  L11_FIX_LINE_7,
  L11_FROM_LINE,
  L11_SOLUTION_3_STARS,
  continueFromResults,
  enterMission,
  replaceEditableCode,
  runAndWait,
  waitForPythonReady,
} from "./helpers";

// Level 1.1 played as GDD 1.1 §11 describes: gate → starter code → case-only miss → 3 stars → transition → next level.

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

test("1.1: starter code breaks on line 7, case-only miss, then 3 stars and on to the next level", async ({ page }) => {
  test.setTimeout(180_000);
  await page.addInitScript(() => {
    (window as unknown as { __TLC_AUDIO_PROBE__: Probe }).__TLC_AUDIO_PROBE__ = [];
  });
  await page.goto("/#/level/1.1");
  await expect(page.locator(".intro-gate")).toContainText("Tầng hầm Lô 17 · Trạm chuyển tiếp R-17");
  await enterMission(page);

  const objectives = page.locator(".objective");
  await expect(objectives).toHaveCount(3);
  for (const n of [1, 2, 3]) await expect(objectives.nth(n - 1)).toContainText(`dòng ${n}`);

  const run = page.getByTestId("run-button");
  await waitForPythonReady(page);
  await expect(run).toHaveClass(/is-first-run/);

  const terminal = page.locator(".terminal-scroll");
  const relayList = page.locator(".relay-list");

  // Run 1: the starter code, as ECHO asks.
  await runAndWait(page);
  await expect(terminal).toContainText("> R-17 ĐÃ PHÁT: dòng 1 · NID/2089");
  await expect(terminal).toContainText("> TRUY VẾT: dòng 7 — NameError");
  await expect(run).not.toHaveClass(/is-first-run/);
  await expect(relayList).toContainText("CHƯA PHÁT");

  // Run 2: line 7 fixed, line 8 still lower case.
  await replaceEditableCode(page, L11_FIX_LINE_7, L11_FROM_LINE);
  await runAndWait(page);
  await expect(terminal).toContainText("sai ở vị trí 1 (chỉ khác hoa thường)");
  await expect(terminal).toContainText("nhận: lo17·can·lien·lac");

  // Run 3: all three lines right; the station reboots with a new session and the code holds.
  await replaceEditableCode(page, L11_SOLUTION_3_STARS, L11_FROM_LINE);
  await runAndWait(page);
  const dialog = page.locator("dialog[open]");
  await expect(dialog).toContainText("Kênh mở hoàn toàn");
  await expect(dialog.locator(".star-row").first()).toHaveAttribute("aria-label", "3 trên 3 sao");
  await expect(dialog).toContainText("Đã thu: Tiêu đề tín hiệu");
  await expect(terminal.locator(".term-line").last()).toHaveText("> KÊNH: MỞ HOÀN TOÀN");
  expect(await events(page)).toEqual(expect.arrayContaining(["siren", "gate_open", "star"]));

  // TIẾP TỤC: the knowledge summary when 1.1 has one, then the transition, then the next built level (1.2).
  await continueFromResults(page, "1.1");
  await expect(page).toHaveURL(/#\/story\/after-1\.1$/);
  await expect(page.getByRole("button", { name: "TIẾP TỤC ĐOẠN TRUYỆN" })).toHaveCount(0);
  await expect(page.locator(".story [aria-live]")).toHaveText("Tín hiệu đầu tiên đi vào Mạng Mù. Trong bộ đệm của trạm R-17 còn sót một dòng log cũ:");
  await expect(page.getByRole("button", { name: /BỎ QUA/ })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page).toHaveURL(/#\/level\/1\.2$/);
  await expect(page.getByRole("button", { name: "VÀO NHIỆM VỤ" })).toBeVisible();
});
