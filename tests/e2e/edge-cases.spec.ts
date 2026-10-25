import { expect, test, type Page } from "@playwright/test";
import { PYODIDE_MODULE_URL } from "../../src/engine/pyodide-config";
import { LEVEL_URL, SOLUTION_67, editorText, enterMission, replaceEditableCode, runAndWait, showTab, syntheticDrop, waitForPythonReady } from "./helpers";

let online = true;
test.beforeAll(async () => {
  try {
    online = (await fetch(PYODIDE_MODULE_URL, { method: "HEAD" })).ok;
  } catch {
    online = false;
  }
});
test.beforeEach(() => test.skip(!online, "SKIP: offline (không tải được Pyodide từ cdn.jsdelivr.net)"));

const LOCKED = ['tuoi = "27"', 'chieu_cao = "1.72"', 'cap_do = "3"'];
const terminal = (page: Page) => page.locator(".terminal-scroll");
async function lockedLinesIntact(page: Page) {
  expect((await editorText(page)).split("\n").slice(1, 4)).toEqual(LOCKED);
}

test.describe.serial("edge cases in one session", () => {
  let page: Page;
  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto(LEVEL_URL);
    await enterMission(page);
    await waitForPythonReady(page);
  });
  test.afterAll(async () => page.close());

  test("drag and drop cannot change locked lines; dropping elsewhere still works (B5)", async () => {
    // (runs on every project; the mouse-drag part is skipped on touch-only devices, see below)
    await showTab(page, "Mã");
    // Positive control: a drop on line 7 is accepted, so the blocked drops below are meaningful.
    await syntheticDrop(page, ".cm-content .cm-line", 6, "# rơi_vào_dòng_7 ");
    expect(await editorText(page)).toContain("rơi_vào_dòng_7");
    // Synthetic drops from outside onto lines 2, 3 and 4.
    for (const nth of [1, 2, 3]) {
      await syntheticDrop(page, ".cm-content .cm-line", nth, "EVIL");
      await lockedLinesIntact(page);
    }
    // Real mouse drags. Touch-only devices have no mouse-driven HTML5 text drag (Playwright cannot
    // emulate one there); the synthetic DataTransfer drops above cover those devices.
    if (await page.evaluate(() => navigator.maxTouchPoints > 0)) return;
    // Real mouse drag of selected editor text (line 7) onto line 3.
    const line7 = page.locator(".cm-content .cm-line").nth(6);
    await line7.dblclick({ position: { x: 30, y: 6 } });
    await line7.dragTo(page.locator(".cm-content .cm-line").nth(2), { targetPosition: { x: 40, y: 6 } });
    await lockedLinesIntact(page);
    // Real drag of a draggable element from outside the editor onto line 2.
    await page.evaluate(() => {
      const src = document.createElement("div");
      src.id = "drag-source";
      src.draggable = true;
      src.textContent = "ngoài editor";
      src.style.cssText = "position:fixed;left:4px;bottom:4px;padding:8px;background:#333;color:#fff;z-index:99";
      src.addEventListener("dragstart", (e) => e.dataTransfer?.setData("text/plain", "OUTSIDE"));
      document.body.append(src);
    });
    await page.locator("#drag-source").dragTo(page.locator(".cm-content .cm-line").nth(1), { targetPosition: { x: 40, y: 6 } });
    await lockedLinesIntact(page);
    await page.evaluate(() => document.getElementById("drag-source")?.remove());
  });

  test("bare except / except BaseException / finally around infinite loops are cut by the fast budget (A11)", async () => {
    const cases = [
      "\nwhile True:\n    try:\n        while True:\n            pass\n    except:\n        pass\n",
      "\nwhile True:\n    try:\n        while True:\n            pass\n    except BaseException:\n        pass\n",
      "\nwhile True:\n    try:\n        while True:\n            pass\n    finally:\n        continue\n",
      "\ndef g():\n    while True:\n        try:\n            yield 1\n        except BaseException:\n            pass\nwhile True:\n    try:\n        for v in g():\n            pass\n    except:\n        pass\n",
      "\nimport contextlib\nwith contextlib.suppress(BaseException):\n    while True:\n        pass\nx = [0 for _ in iter(int, 1)]\n",
    ];
    for (const code of cases) {
      await replaceEditableCode(page, code);
      const start = Date.now();
      await runAndWait(page);
      const elapsed = Date.now() - start;
      await expect(terminal(page)).toContainText("TIẾN TRÌNH BỊ CẮT: quá thời gian");
      // The wall-clock fallback is 5 s and would also rebuild the worker; the budget path does neither.
      expect(elapsed, code).toBeLessThan(4000);
      await expect(page.getByTestId("run-button")).not.toContainText("KHỞI ĐỘNG LẠI");
    }
  });

  test("a hang only during the counter-attack keeps the base stars (C-hang on new chip data)", async () => {
    await replaceEditableCode(
      page,
      '\nif tuoi == "31.0":\n    sum(range(10**12))\nma_xac_thuc = int(float(tuoi)) * 100 + int(float(cap_do))\nchi_so = round(float(chieu_cao) * 2, 2)\nhop_le = True\n',
    );
    await page.getByTestId("run-button").click();
    const dialog = page.locator("dialog[open]");
    await expect(dialog).toBeVisible({ timeout: 30_000 });
    await expect(dialog.locator(".results-stars .star-row").first()).toHaveAttribute("aria-label", "2 trên 3 sao");
    await expect(dialog).toContainText("Chống được OMNI phản công");
    await page.getByRole("button", { name: "Tối ưu tiếp" }).click();
    await expect(terminal(page)).toContainText("TIẾN TRÌNH BỊ CẮT KHI OMNI PHẢN CÔNG");
    await expect(page.locator(".echo-live")).toContainText("Mã của bạn treo trên dữ liệu mới");
    await waitForPythonReady(page, 60_000);
    await replaceEditableCode(page, SOLUTION_67);
    await runAndWait(page);
    await expect(page.locator("dialog[open]")).toContainText("Cổng mở hoàn toàn");
    await page.getByRole("button", { name: "Tối ưu tiếp" }).click();
  });
});

test("reduced motion: plays to 3 stars, no glitch/shake/typewriter, nothing hidden (E8)", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto(LEVEL_URL);
  await enterMission(page);
  await waitForPythonReady(page);
  await replaceEditableCode(page, SOLUTION_67);
  const start = Date.now();
  await page.getByTestId("run-button").click();
  await expect(page.locator("dialog[open]")).toContainText("Cổng mở hoàn toàn", { timeout: 15_000 });
  // No 4 s + 4 s scanner animation: the result appears right after Python finishes.
  expect(Date.now() - start).toBeLessThan(4000);
  await page.getByRole("button", { name: "Tối ưu tiếp" }).click();
  const state = await page.evaluate(() => {
    const dur = (sel: string) => {
      const el = document.querySelector(sel);
      return el ? parseFloat(getComputedStyle(el).animationDuration) || 0 : 0;
    };
    return {
      speaking: document.querySelectorAll(".echo-portrait.is-speaking").length,
      shaking: document.querySelectorAll(".is-shaking").length,
      caret: document.querySelectorAll(".caret").length,
      skipButton: [...document.querySelectorAll("button")].some((b) => b.textContent?.includes("Bỏ qua hoạt cảnh")),
      beam: dur(".scanner-beam"),
      lamp: dur(".sentinel-lamp"),
      echoVisible: document.querySelector(".echo-bubble .echo-line")?.textContent ?? "",
    };
  });
  expect(state.speaking).toBe(0);
  expect(state.shaking).toBe(0);
  expect(state.caret).toBe(0);
  expect(state.skipButton).toBe(false);
  expect(state.beam).toBeLessThan(0.01);
  expect(state.lamp).toBeLessThan(0.01);
  // The ECHO bubble shows the line in full at once (no typewriter hiding text).
  expect(state.echoVisible).toBe("Cổng mở hoàn toàn. OMNI đổi dữ liệu, mã vẫn đứng vững. …Tôi ghi nhận điều đó.");
  await showTab(page, "Mô phỏng");
  await expect(page.locator(".sim-status")).toHaveText("CỔNG MỞ HOÀN TOÀN");
  await context.close();
});

test("very large value: 10^8-char string graded, only a preview crosses postMessage (A26)", async ({ page }) => {
  await page.goto(LEVEL_URL);
  await enterMission(page);
  await waitForPythonReady(page);
  await replaceEditableCode(page, '\nma_xac_thuc = "x" * 10**8\nchi_so = 3.44\nhop_le = True\n');
  await runAndWait(page);
  await expect(terminal(page)).toContainText("MÁY QUÉT TỪ CHỐI: ma_xac_thuc: str (100000000 ký tự), yêu cầu int");
  await waitForPythonReady(page, 30_000);
});

test("no module-worker support: in-world unsupported-browser screen (C4)", async ({ page }) => {
  await page.addInitScript(() => {
    const Native = window.Worker;
    window.Worker = class extends Native {
      constructor(url: string | URL, opts?: WorkerOptions) {
        if (opts?.type === "module") throw new TypeError("Module scripts are not supported");
        super(url, opts);
      }
    } as typeof Worker;
  });
  await page.goto(LEVEL_URL);
  await expect(page.getByRole("heading", { name: "TRÌNH DUYỆT KHÔNG HỖ TRỢ" })).toBeVisible();
  await expect(page.getByText("Chrome hoặc Edge 80+")).toBeVisible();
});

test("layout holds at 1280, 768 and 360 px wide (E1)", async ({ page }) => {
  await page.goto(LEVEL_URL);
  for (const width of [1280, 768, 360]) {
    await page.setViewportSize({ width, height: 800 });
    await page.waitForTimeout(150);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, `horizontal overflow at ${width}px`).toBeLessThanOrEqual(0);
    await expect(page.locator(".cm-editor")).toBeAttached();
  }
});

test("colour is never the only signal: type labels on packets, icon + word on alarms (E9)", async ({ page }) => {
  await page.goto(LEVEL_URL);
  await enterMission(page);
  await waitForPythonReady(page);
  await runAndWait(page);
  await showTab(page, "Mô phỏng");
  await expect(page.locator(".packet-type")).toHaveText(["str", "str", "str"]);
  await expect(page.locator(".sim-status.scanner-alarm svg")).toHaveCount(1);
  await expect(page.locator(".sim-status")).toHaveText(/SAI KIỂU: str ≠ int/);
  await showTab(page, "Nhiệm vụ");
  await expect(page.locator(".objective .type-chip")).toHaveText(["int", "float", "bool"]);
});

test("keyboard only: reach the editor, type, leave with Esc+Tab, run, skip animation, close dialog (E7)", async ({ page }) => {
  test.skip(await page.evaluate(() => navigator.maxTouchPoints > 0).catch(() => false), "touch layout has no hardware keyboard flow");
  await page.goto(LEVEL_URL);
  // The entry gate has focus: Enter starts the level, Esc skips the reveal.
  await expect(page.getByRole("button", { name: "VÀO NHIỆM VỤ" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("button", { name: "VÀO NHIỆM VỤ" })).toHaveCount(0);
  await expect(async () => {
    await page.keyboard.press("Escape");
    await expect(page.locator(".alert-meter.is-in")).toHaveCount(1, { timeout: 300 });
  }).toPass({ timeout: 10_000 });
  await waitForPythonReady(page);
  // Tab from the top of the page until the editor has focus.
  for (let i = 0; i < 20 && !(await page.evaluate(() => !!document.activeElement?.closest(".cm-content"))); i++) {
    await page.keyboard.press("Tab");
  }
  expect(await page.evaluate(() => !!document.activeElement?.closest(".cm-content"))).toBe(true);
  // Go to the end of the document and replace line 7..12 using the keyboard only.
  await page.keyboard.press("ControlOrMeta+End");
  for (let i = 0; i < 6; i++) await page.keyboard.press("Shift+ArrowUp");
  await page.keyboard.press("Shift+Home");
  await page.keyboard.press("Delete");
  for (const [i, line] of ["ma_xac_thuc = int(float(tuoi)) * 100 + int(float(cap_do))", "chi_so = round(float(chieu_cao) * 2, 2)", "hop_le = True"].entries()) {
    if (i > 0) await page.keyboard.press("Enter");
    await page.keyboard.insertText(line);
  }
  // Esc then Tab leaves the editor (Tab alone indents) and lands on CHẠY.
  await page.keyboard.press("Escape");
  await page.keyboard.press("Tab");
  await expect(page.getByTestId("run-button")).toBeFocused();
  await page.keyboard.press("ControlOrMeta+Enter");
  // Esc skips the scanner animation: the dialog shows well before the ~8 s full playback.
  await expect(page.getByRole("button", { name: /Bỏ qua hoạt cảnh/ })).toBeVisible({ timeout: 15_000 });
  const t = Date.now();
  await page.keyboard.press("Escape");
  await expect(page.locator("dialog[open]")).toContainText("Cổng mở hoàn toàn");
  expect(Date.now() - t).toBeLessThan(2500);
  // Esc closes the dialog and focus returns to CHẠY.
  await page.keyboard.press("Escape");
  await expect(page.locator("dialog[open]")).toHaveCount(0);
  await expect(page.getByTestId("run-button")).toBeFocused();
});

test("two tabs on the same profile: last write wins, nothing corrupts (D7)", async ({ context }) => {
  const a = await context.newPage();
  const b = await context.newPage();
  await a.goto(LEVEL_URL);
  await enterMission(a);
  await b.goto(LEVEL_URL);
  await enterMission(b);
  await replaceEditableCode(a, "\n# từ tab A\n");
  await a.waitForTimeout(700);
  await replaceEditableCode(b, "\n# từ tab B\n");
  await b.waitForTimeout(700);
  const c = await context.newPage();
  await c.goto(LEVEL_URL);
  await expect(c.locator(".cm-content")).toContainText("# từ tab B");
  await expect(c.locator(".cm-content")).not.toContainText("# từ tab A");
  expect((await editorText(c)).split("\n").slice(1, 4)).toEqual(LOCKED);
});
