import { expect, test, type Page } from "@playwright/test";
import { PYODIDE_MODULE_URL } from "../../src/engine/pyodide-config";
import {
  LEVEL_URL,
  SOLUTION_66,
  SOLUTION_67,
  TYPE_ERROR,
  editorText,
  enterMission,
  openEchoChat,
  replaceEditableCode,
  runAndWait,
  showTab,
  syntheticPaste,
  waitForPythonReady,
} from "./helpers";

let online = true;
test.beforeAll(async () => {
  try {
    const res = await fetch(PYODIDE_MODULE_URL, { method: "HEAD" });
    online = res.ok;
  } catch {
    online = false;
  }
});
test.beforeEach(() => {
  test.skip(!online, "SKIP: offline (không tải được Pyodide từ cdn.jsdelivr.net)");
});

const terminal = (page: Page) => page.locator(".terminal-scroll");
const echoText = (page: Page) => page.locator(".echo-live");
const runCount = async (page: Page) => Number(await page.getByTestId("run-count").innerText());
const LOCKED = ['tuoi = "27"', 'chieu_cao = "1.72"', 'cap_do = "3"'];
async function lockedLinesIntact(page: Page) {
  const lines = (await editorText(page)).split("\n");
  expect(lines.slice(1, 4)).toEqual(LOCKED);
}
async function closeDialog(page: Page) {
  await page.getByRole("button", { name: "Tối ưu tiếp" }).click();
  await expect(page.locator("dialog[open]")).toHaveCount(0);
}

test.describe.serial("level 1.4 main flow (real Pyodide)", () => {
  let page: Page;
  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
  });
  test.afterAll(async () => {
    await page.close();
  });

  test("boot: run button locked while Python loads, then ready (C1)", async () => {
    await page.goto(LEVEL_URL);
    await enterMission(page);
    const run = page.getByTestId("run-button");
    await expect(run).toBeDisabled();
    await expect(run).toContainText("LÕI ĐANG KHỞI ĐỘNG");
    await showTab(page, "Mô phỏng");
    await expect(page.locator(".boot")).toBeVisible();
    await showTab(page, "Mã");
    await waitForPythonReady(page);
    await expect(terminal(page)).toContainText("SẴN SÀNG");
  });

  test("original code: scanner rejects, no traceback, ECHO says wrong shape (AC 1, 8)", async () => {
    await runAndWait(page);
    await expect(terminal(page)).toContainText("MÁY QUÉT TỪ CHỐI: ma_xac_thuc: str (201 ký tự), yêu cầu int");
    await expect(terminal(page)).not.toContainText("TRUY VẾT");
    await expect(echoText(page)).toContainText("Máy quét từ chối ma_xac_thuc, chi_so, hop_le. Sai hình dạng.");
    await expect(page.locator(".sim-status")).toContainText("SAI KIỂU: str ≠ int");
  });

  test("real Python error shows an in-context traceback on editor line 7 (AC 1b)", async () => {
    await replaceEditableCode(page, TYPE_ERROR);
    await runAndWait(page);
    await expect(terminal(page)).toContainText("TRUY VẾT: dòng 7 — TypeError");
    await expect(echoText(page)).toContainText("Dòng 7. TypeError.");
  });

  test("GDD 6.6 gives 2 stars and the counter-attack ValueError (AC 2)", async () => {
    await replaceEditableCode(page, SOLUTION_66);
    await runAndWait(page);
    await expect(page.locator("dialog[open]")).toBeVisible();
    await expect(page.locator("dialog[open] .results-stars .star-row").first()).toHaveAttribute("aria-label", "2 trên 3 sao");
    await closeDialog(page);
    await expect(terminal(page)).toContainText("CẢNH BÁO: OMNI ĐÃ THAY ĐỔI ĐỊNH DẠNG CHIP");
    await expect(terminal(page)).toContainText("TRUY VẾT: dòng 7 — ValueError");
    await expect(page.getByTestId("run-button")).toBeFocused();
  });

  test("GDD 6.7 gives 3 stars; results show hints opened (AC 3, 11)", async () => {
    await replaceEditableCode(page, SOLUTION_67);
    await runAndWait(page);
    const dialog = page.locator("dialog[open]");
    await expect(dialog).toContainText("Cổng mở hoàn toàn");
    await expect(dialog.locator(".results-stars .star-row").first()).toHaveAttribute("aria-label", "3 trên 3 sao");
    await expect(dialog).toContainText("Số gợi ý đã mở");
    await expect(dialog).toContainText("Số lần chạy");
    // The lore fragment moved to the transition story; the dialog names the component instead.
    await expect(dialog).toContainText("Đã thu: Dữ liệu sinh trắc");
    await expect(dialog.getByRole("button", { name: "TIẾP TỤC" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.locator("dialog[open]")).toHaveCount(0);
  });

  test("locked lines survive typing, select-all delete or paste; edits across them apply around them (AC 5)", async ({ browserName }) => {
    await showTab(page, "Mã");
    await page.locator(".cm-content .cm-line").nth(2).click();
    await page.keyboard.type("xyz");
    await lockedLinesIntact(page);
    await page.keyboard.press("Backspace");
    await lockedLinesIntact(page);
    await page.keyboard.press("ControlOrMeta+a");
    await page.keyboard.press("Backspace");
    await lockedLinesIntact(page);
    await page.keyboard.press("ControlOrMeta+a");
    await page.keyboard.insertText("pasted over everything");
    await lockedLinesIntact(page);
    expect((await editorText(page)).split("\n")[0]).toBe("pasted over everything");
    await expect(page.locator(".editor-shell .sr-only")).toContainText("Dòng dữ liệu nạp sẵn vẫn giữ nguyên.");
    // Paste over everything: a ClipboardEvent in every engine, plus the real OS clipboard in Chromium.
    await page.keyboard.press("ControlOrMeta+a");
    await syntheticPaste(page, "tuoi = 99");
    await lockedLinesIntact(page);
    if (browserName === "chromium") {
      await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
      await page.evaluate(() => navigator.clipboard.writeText("tuoi = 99"));
      await page.keyboard.press("ControlOrMeta+a");
      await page.keyboard.press("ControlOrMeta+v");
      await lockedLinesIntact(page);
    }
    // Backspace at the start of line 5 would join it into line 4.
    await page.locator(".cm-content .cm-line").nth(4).click({ position: { x: 2, y: 5 } });
    await page.keyboard.press("Home");
    await page.keyboard.press("Backspace");
    await lockedLinesIntact(page);
    await expect(page.locator(".editor-shell .sr-only")).toContainText("Dòng dữ liệu nạp sẵn bị khóa.");
  });

  test("keyboard: focus stays on CHẠY through a 0-star run (E7)", async () => {
    await replaceEditableCode(page, TYPE_ERROR);
    await page.getByTestId("run-button").focus();
    await page.keyboard.press("Enter");
    await expect(terminal(page)).toContainText("TypeError");
    await page.waitForFunction(() => document.querySelector('[data-testid="run-button"]')!.getAttribute("aria-disabled") !== "true");
    await expect(page.getByTestId("run-button")).toBeFocused();
  });

  test("reset restores the starter with a clean undo history (B8)", async () => {
    await showTab(page, "Mã");
    await page.getByRole("button", { name: "Khôi phục mã gốc" }).click();
    await page.getByRole("button", { name: "Xác nhận khôi phục" }).click();
    await expect(terminal(page)).toContainText("Đã khôi phục mã gốc.");
    expect(await editorText(page)).toContain("ma_xac_thuc = tuoi * 100 + cap_do");
    await page.locator(".cm-content .cm-line").nth(6).click();
    await page.keyboard.press("ControlOrMeta+z");
    await lockedLinesIntact(page);
    expect(await editorText(page)).toContain("ma_xac_thuc = tuoi * 100 + cap_do");
    await expect(page.locator(".editor-shell .sr-only")).toHaveText("");
  });

  test("double click on CHẠY counts one run (C2)", async () => {
    await showTab(page, "Mã");
    const before = await runCount(page);
    await page.getByTestId("run-button").dblclick();
    await expect(terminal(page)).toContainText(`LƯỢT CHẠY #${before + 1}`);
    await page.waitForFunction(
      () => !!document.querySelector("dialog[open]") || document.querySelector('[data-testid="run-button"]')!.getAttribute("aria-disabled") !== "true",
    );
    if (await page.locator("dialog[open]").count()) await closeDialog(page);
    expect(await runCount(page)).toBe(before + 1);
    await expect(terminal(page)).not.toContainText(`LƯỢT CHẠY #${before + 2}`);
  });

  test("infinite Python loop is cut, then the worker still runs 6.7 (A11)", async () => {
    await replaceEditableCode(page, "\nwhile True:\n    pass\n");
    await runAndWait(page);
    await expect(terminal(page)).toContainText("TIẾN TRÌNH BỊ CẮT");
    await replaceEditableCode(page, SOLUTION_67);
    await runAndWait(page);
    await expect(page.locator("dialog[open]")).toContainText("Cổng mở hoàn toàn");
    await closeDialog(page);
  });

  test("hang inside C code: wall-clock timeout, worker rebuilt from cache (A12)", async () => {
    await replaceEditableCode(page, "\nx = 10**10**8\n");
    await runAndWait(page);
    await expect(terminal(page)).toContainText("TIẾN TRÌNH BỊ CẮT");
    await waitForPythonReady(page, 60_000);
    await replaceEditableCode(page, SOLUTION_67);
    await runAndWait(page);
    await expect(page.locator("dialog[open]")).toContainText("Cổng mở hoàn toàn");
    await closeDialog(page);
  });

  test("huge allocation becomes resource_limit in Pyodide (A27)", async () => {
    await replaceEditableCode(page, '\nx = "x" * 10**10\n');
    await runAndWait(page);
    await expect(terminal(page)).toContainText("TIẾN TRÌNH BỊ CẮT: bộ nhớ quá tải");
    await waitForPythonReady(page, 60_000);
  });

  test("reload keeps draft, best stars, runs and hints (AC 10)", async () => {
    await replaceEditableCode(page, SOLUTION_67 + "# ghi chú giữ lại\n");
    await openEchoChat(page);
    const hint = page.getByRole("button", { name: /Giải mã nhật ký gợi ý/ });
    await hint.click();
    await page.getByRole("button", { name: /Xác nhận: giải mã mức 1/ }).click();
    await expect(page.locator(".hints")).toContainText("1/3 đã giải mã");
    await page.keyboard.press("Escape");
    const runs = await runCount(page);
    await page.waitForTimeout(700); // draft debounce
    await page.reload();
    await enterMission(page);
    await expect(page.locator(".cm-content")).toContainText("# ghi chú giữ lại");
    await lockedLinesIntact(page);
    expect(await runCount(page)).toBe(runs);
    await expect(page.locator(".topbar .star-row")).toHaveAttribute("aria-label", "3 trên 3 sao");
    await openEchoChat(page);
    await expect(page.locator(".hints")).toContainText("1/3 đã giải mã");
    // The decoded hint reappears as an ECHO message in the chat.
    await expect(page.locator(".echo-msg.is-hint")).toContainText("Nhìn mô phỏng sau khi chạy");
  });
});

test("storage blocked: no-save mode, still playable to 3 stars (AC 10, D1)", async ({ browser }) => {
  const context = await browser.newContext();
  await context.addInitScript(() => {
    const deny = () => {
      throw new DOMException("blocked", "SecurityError");
    };
    Storage.prototype.getItem = deny;
    Storage.prototype.setItem = deny;
  });
  const page = await context.newPage();
  await page.goto(LEVEL_URL);
  await enterMission(page);
  await expect(page.getByText("CHẾ ĐỘ KHÔNG LƯU")).toBeVisible();
  await waitForPythonReady(page);
  await replaceEditableCode(page, SOLUTION_67);
  await runAndWait(page);
  await expect(page.locator("dialog[open]")).toContainText("Cổng mở hoàn toàn");
  await context.close();
});

test("375 px: no horizontal scroll, tabs work, run switches to the simulation (E1, E2)", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const page = await context.newPage();
  await page.goto(LEVEL_URL);
  await enterMission(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
  await page.getByRole("button", { name: "Nhiệm vụ", exact: true }).click();
  await expect(page.locator(".briefing")).toBeVisible();
  await page.getByRole("button", { name: "Mã", exact: true }).click();
  await expect(page.locator(".cm-editor")).toBeVisible();
  await waitForPythonReady(page);
  await replaceEditableCode(page, SOLUTION_66);
  await page.getByTestId("run-button").click();
  await expect(page.locator(".sim-svg")).toBeVisible();
  await expect(page.getByRole("button", { name: "Mô phỏng", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("dialog[open]")).toBeVisible({ timeout: 30_000 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
  await context.close();
});

test("CDN blocked: in-world load error with retry that recovers (C3)", async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  // Context-level routing also covers requests made by the module worker.
  await context.route("**/cdn.jsdelivr.net/**", (route) => route.abort());
  await page.goto(LEVEL_URL);
  await enterMission(page, { codeTab: false });
  await showTab(page, "Mô phỏng");
  // On the phone layout the game switches to the simulation tab, where the error lives.
  await expect(page.getByText("KHÔNG KẾT NỐI ĐƯỢC LÕI PYTHON")).toBeVisible({ timeout: 60_000 });
  await expect(page.getByTestId("run-button")).toBeDisabled();
  await expect(page.locator(".cm-editor")).toBeAttached();
  await context.unroute("**/cdn.jsdelivr.net/**");
  await page.getByRole("button", { name: "THỬ LẠI" }).click();
  await waitForPythonReady(page);
  await context.close();
});
