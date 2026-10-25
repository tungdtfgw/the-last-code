import { expect, type Page } from "@playwright/test";

/** `/` is the title screen; level tests open the level route directly. */
export const LEVEL_URL = "/#/level/1.4";

export type TabName = "Nhiệm vụ" | "Mã" | "Mô phỏng";

/** On the phone layout (< 768 px) panels live behind tabs; on wider layouts this is a no-op. */
export async function showTab(page: Page, name: TabName) {
  const tab = page.getByRole("button", { name, exact: true });
  if (await tab.isVisible()) await tab.click();
}

/**
 * Pass the level's entry gate, skip the intro reveal, and show the code tab on phones.
 * Every level start shows the gate; its click is the first user gesture.
 */
export async function enterMission(page: Page, opts: { codeTab?: boolean } = {}) {
  const gate = page.getByRole("button", { name: "VÀO NHIỆM VỤ" });
  // After a story the gate ignores clicks for a moment; wait until it accepts them.
  await expect(gate).toHaveAttribute("data-armed", "true");
  await gate.click();
  await expect(gate).toHaveCount(0);
  // Esc skips the reveal; retry in case the skip listener was not attached yet.
  await expect(async () => {
    await page.keyboard.press("Escape");
    await expect(page.locator(".alert-meter.is-in")).toHaveCount(1, { timeout: 300 });
  }).toPass({ timeout: 10_000 });
  if (opts.codeTab !== false) await showTab(page, "Mã");
}

/**
 * Results dialog TIẾP TỤC. A level with a knowledge summary shows it first; its
 * TIẾP TỤC (focused, Enter) then leads to the transition as before.
 */
export async function continueFromResults(page: Page, levelId: string) {
  await page.locator("dialog[open]").getByRole("button", { name: "TIẾP TỤC" }).click();
  await expect(page).toHaveURL(new RegExp(`#/(learn|story)/(after-)?${levelId.replace(".", "\\.")}$`));
  if (!page.url().includes("#/learn/")) return;
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const next = page.getByRole("button", { name: "TIẾP TỤC" });
  await expect(next).toBeFocused();
  await page.keyboard.press("Enter");
}

/** Open the ECHO chat with its button (works on every layout) and wait for the panel. */
export async function openEchoChat(page: Page) {
  const fab = page.locator(".echo-fab");
  if ((await fab.getAttribute("aria-expanded")) !== "true") await fab.click();
  await expect(page.locator(".echo-chat")).toBeVisible();
}

/** Open a level by its route and pass its entry gate. */
export async function gotoLevel(page: Page, id = "1.4", opts: { codeTab?: boolean } = {}) {
  await page.goto(`/#/level/${id}`);
  await enterMission(page, opts);
}

/** Wait until Pyodide is loaded and the run button is enabled. */
export async function waitForPythonReady(page: Page, timeout = 120_000) {
  await expect(page.getByTestId("run-button")).toBeEnabled({ timeout });
  await expect(page.getByTestId("run-button")).toContainText("CHẠY");
}

/**
 * Replace everything after the locked block (from the start of `fromLine`, default 5)
 * with `text`, using only real keyboard input.
 */
export async function replaceEditableCode(page: Page, text: string, fromLine = 5) {
  await showTab(page, "Mã");
  const line = page.locator(".cm-content .cm-line").nth(fromLine - 1);
  // A horizontally scrolled editor puts the line start under the sticky gutter.
  await page.locator(".cm-scroller").evaluate((el) => (el.scrollLeft = 0));
  await line.click({ position: { x: 2, y: 5 } });
  await page.keyboard.press("Home");
  await page.keyboard.press("ControlOrMeta+Shift+End");
  await page.keyboard.press("Delete");
  // Type line by line: Enter may auto-indent, so clear to the line start before inserting.
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    if (i > 0) await page.keyboard.press("Enter");
    await page.keyboard.press("Shift+Home");
    await page.keyboard.press("Delete");
    if (lines[i]) await page.keyboard.insertText(lines[i]);
  }
}

export async function editorText(page: Page) {
  return (await page.locator(".cm-content .cm-line").allInnerTexts()).join("\n");
}

/** Run and wait for the animation to finish (run button back to "CHẠY" or a result dialog). */
export async function runAndWait(page: Page) {
  await page.getByTestId("run-button").click();
  await expect(page.locator(".terminal-scroll")).toContainText(/LƯỢT CHẠY #\d+/, { timeout: 30_000 });
  await page.waitForFunction(
    () => {
      const btn = document.querySelector<HTMLButtonElement>('[data-testid="run-button"]');
      const dialog = document.querySelector("dialog[open]");
      return !!dialog || (!!btn && btn.querySelector("span")?.textContent === "CHẠY" && btn.getAttribute("aria-disabled") !== "true");
    },
    null,
    { timeout: 30_000 },
  );
}

export const SOLUTION_66 =
  "\n# Mã xác thực = tuổi × 100 + cấp độ\nma_xac_thuc = int(tuoi) * 100 + int(cap_do)\n\n# Chỉ số sinh học\nchi_so = round(float(chieu_cao) * 2, 2)\n\nhop_le = True\n";
export const SOLUTION_67 =
  "\n# Mã xác thực = tuổi × 100 + cấp độ\nma_xac_thuc = int(float(tuoi)) * 100 + int(float(cap_do))\n\n# Chỉ số sinh học\nchi_so = round(float(chieu_cao) * 2, 2)\n\nhop_le = True\n";
export const TYPE_ERROR =
  "\n# Mã xác thực = tuổi × 100 + cấp độ\nma_xac_thuc = int(tuoi) * 100 + cap_do\n\n# Chỉ số sinh học\nchi_so = chieu_cao * 2\n\nhop_le = \"True\"\n";

/** Drop plain text onto an element with a synthetic HTML5 drag sequence (dragenter → dragover → drop). */
export async function syntheticDrop(page: Page, selector: string, nth: number, text: string) {
  await page.evaluate(
    ({ selector, nth, text }) => {
      const target = document.querySelectorAll(selector)[nth] as HTMLElement;
      const r = target.getBoundingClientRect();
      const dt = new DataTransfer();
      dt.setData("text/plain", text);
      const init = { bubbles: true, cancelable: true, clientX: r.left + 20, clientY: r.top + r.height / 2, dataTransfer: dt };
      for (const type of ["dragenter", "dragover", "drop"]) target.dispatchEvent(new DragEvent(type, init));
    },
    { selector, nth, text },
  );
}

/** Paste text through a synthetic ClipboardEvent (works in every engine, no clipboard permission needed). */
export async function syntheticPaste(page: Page, text: string) {
  await page.evaluate((text) => {
    const dt = new DataTransfer();
    dt.setData("text/plain", text);
    const ev = new ClipboardEvent("paste", { bubbles: true, cancelable: true, clipboardData: dt });
    (document.activeElement ?? document.body).dispatchEvent(ev);
  }, text);
}

/** Level 1.1: the locked line is 3, so edits start at line 4. Bodies below replace lines 4 to the end. */
export const L11_FROM_LINE = 4;
const L11_HEAD = "\n# Bản nháp gói bắt tay của Kai. Trạm chưa nhận dòng nào.\nprint(\"NID/2089\")\n";
export const L11_FIX_LINE_7 = `${L11_HEAD}print("PHIEN", ma_phien)\nprint("lo17 can lien lac")\n`;
export const L11_SOLUTION_3_STARS = `${L11_HEAD}print("PHIEN", ma_phien)\nprint("LO17 CAN LIEN LAC")\n`;

/** Level 1.2: the buffer is locked on lines 2–5, so edits start at line 6. Bodies below replace lines 6 to the end. */
export const L12_FROM_LINE = 6;
export const L12_SOLUTION_3_STARS = [
  "",
  "# Ô nhớ của ki-ốt. Mỗi ô một nhãn.",
  "ho_ten = goi_1",
  "ma_khu = goi_2",
  "so_hieu = goi_3",
  "khu_cu = ma_khu",
  "ma_khu = goi_4",
  'the_quet = ho_ten + " / " + ma_khu',
  'the_cong = so_hieu + " / " + ma_khu',
  "print(the_quet)",
  "print(the_cong)",
  "",
].join("\n");

/** Level 1.3: the session code is locked on line 2; `ho_ten` (line 5) is right as given, so edits start at line 6. */
export const L13_FROM_LINE = 6;
export const L13_SOLUTION_3_STARS = [
  "tuoi = 27",
  "chieu_cao = 1.72",
  "da_tiem = True",
  "",
  "# Hỏi hình dạng của một giá trị",
  "print(type(ho_ten))",
  "",
  "# Máy quét đòi khuôn của mã phiên",
  "khuon_phien = type(ma_phien)",
  "",
].join("\n");
