import { expect, test, type Page } from "./fixtures";
import { PYODIDE_MODULE_URL } from "../../src/engine/pyodide-config";
import { SOLUTION_67, enterMission, replaceEditableCode, runAndWait, waitForPythonReady, continueFromResults } from "./helpers";

// Game shell: title → prologue → level → transition → next level, and direct links.
// The chapter's end (after-1.7 → teaser → map) is covered by level-1-7.spec.ts.

type Probe = { event: string }[];
const instrument = (page: Page) =>
  page.addInitScript(() => {
    (window as unknown as { __TLC_AUDIO_PROBE__: Probe }).__TLC_AUDIO_PROBE__ = [];
  });
const events = (page: Page) =>
  page.evaluate(() => (window as unknown as { __TLC_AUDIO_PROBE__: Probe }).__TLC_AUDIO_PROBE__.map((e) => e.event));
const node = (page: Page, id: string) => page.locator(`.map-node[data-level="${id}"]`);

async function startFromTitle(page: Page) {
  await page.goto("/");
  const start = page.getByRole("button", { name: "BẮT ĐẦU" });
  await expect(start).toBeFocused();
  await start.click();
  await expect(page).toHaveURL(/#\/story\/prologue$/);
  await expect(page.getByRole("button", { name: /BỎ QUA/ })).toBeVisible();
}

test("new player: title → prologue → level gate → map, one AudioContext throughout", async ({ page }) => {
  await instrument(page);
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "MÃ CUỐI CÙNG" })).toBeVisible();
  await expect(page.getByRole("button", { name: "BẮT ĐẦU" })).toBeFocused();
  await expect(page.getByText("Đang chơi:")).toBeVisible();
  expect(await events(page)).toEqual([]);

  await page.getByRole("button", { name: "BẮT ĐẦU" }).click();
  await expect(page).toHaveURL(/#\/story\/prologue$/);
  // Reached from a button: no story gate, audio already unlocked by that click.
  await expect(page.getByRole("button", { name: "TIẾP TỤC ĐOẠN TRUYỆN" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /BỎ QUA/ })).toBeVisible();
  await expect.poll(() => events(page)).toEqual(expect.arrayContaining(["context", "pulse"]));
  await expect(page.locator(".story [aria-live]")).toHaveText("NĂM 2089");

  // Space shows the next beat (cards appear whole, so one press moves on).
  await page.keyboard.press("Space");
  await expect(page.locator(".story [aria-live]")).toContainText("OMNI điều phối mọi thứ");

  // 1.1 is the first built level of the chapter.
  await page.keyboard.press("Escape");
  await expect(page).toHaveURL(/#\/level\/1\.1$/);
  await enterMission(page);
  expect((await events(page)).filter((e) => e === "context")).toHaveLength(1);

  await page.getByRole("button", { name: "BẢN ĐỒ", exact: true }).click();
  await expect(page).toHaveURL(/#\/map$/);
  await expect(node(page, "1.1")).toContainText("TIẾP THEO");
  await expect(node(page, "1.1")).toBeFocused();
  await expect(node(page, "1.2")).toContainText("Cần 1 sao ở 1.1");
  await expect(node(page, "1.3")).toContainText("Cần 1 sao ở 1.2");
  await expect(node(page, "1.4")).toContainText("Cần 1 sao ở 1.3");
  await expect(node(page, "1.5")).toContainText("Cần 1 sao ở 1.4");
  await expect(node(page, "1.6")).toContainText("Cần 1 sao ở 1.5");
  await expect(node(page, "1.7")).toContainText("Cần 1 sao ở 1.6");
  await expect(page.locator(".map-node")).toHaveCount(7);
  await expect(page.getByText("TÍN HIỆU HỎNG")).toHaveCount(0);
  await expect(page.getByTestId("chapter-stars")).toHaveText("0/21");
  await expect(page.getByRole("button", { name: "Mở đầu" })).toBeVisible();

  await page.goto("/");
  await expect(page.getByRole("button", { name: "TIẾP TỤC" })).toBeFocused();
  await expect(page.getByRole("button", { name: "BẢN ĐỒ VÙNG TỐI" })).toBeVisible();
});

test.describe("with Python", () => {
  let online = true;
  test.beforeAll(async () => {
    try {
      online = (await fetch(PYODIDE_MODULE_URL, { method: "HEAD" })).ok;
    } catch {
      online = false;
    }
  });
  test.beforeEach(() => test.skip(!online, "SKIP: offline (không tải được Pyodide từ cdn.jsdelivr.net)"));

  test("clearing 1.4 by link: results TIẾP TỤC → transition → the 1.5 gate; map counts 3/21; title TIẾP TỤC then opens 1.1", async ({ page }) => {
    test.setTimeout(180_000);
    await startFromTitle(page);
    await page.keyboard.press("Escape");
    await expect(page).toHaveURL(/#\/level\/1\.1$/);
    // 1.4 is locked on the map until 1.3 has a star, but its link still opens it.
    await page.goto("/#/level/1.4");
    await enterMission(page);
    await waitForPythonReady(page);
    await replaceEditableCode(page, SOLUTION_67);
    await runAndWait(page);
    const dialog = page.locator("dialog[open]");
    await expect(dialog).toContainText("Đã thu: Dữ liệu sinh trắc");
    await expect(dialog).not.toContainText("KTS-03");
    await continueFromResults(page, "1.4");

    await expect(page).toHaveURL(/#\/story\/after-1\.4$/);
    await expect(page.getByRole("button", { name: "TIẾP TỤC ĐOẠN TRUYỆN" })).toHaveCount(0);
    await expect(page.locator(".story [aria-live]")).toHaveText("Cổng phía Bắc mở. Trong bộ nhớ chip còn sót một dòng log chưa bị xóa:");
    await page.keyboard.press("Escape");

    // 1.4 is no longer the last level: its transition leads into 1.5.
    await expect(page).toHaveURL(/#\/level\/1\.5$/);
    await expect(page.getByRole("button", { name: "VÀO NHIỆM VỤ" })).toBeVisible();

    await page.goto("/#/map");
    await expect(page).toHaveURL(/#\/map$/);
    await expect(node(page, "1.4").locator(".star-row")).toHaveAttribute("aria-label", "3 trên 3 sao");
    await expect(page.locator(".map-lore")).toContainText("KTS-03");
    await expect(page.getByTestId("chapter-stars")).toHaveText("3/21");
    // 1.5 opens with the star on 1.4; 1.1 (no star yet) stays the "TIẾP THEO" node.
    await expect(node(page, "1.5")).not.toHaveAttribute("aria-disabled", "true");
    await expect(node(page, "1.5")).not.toContainText("Cần 1 sao");
    await expect(node(page, "1.6")).toContainText("Cần 1 sao ở 1.5");
    for (const label of ["Mở đầu", "Sau 1.4"]) await expect(page.getByRole("button", { name: label })).toBeVisible();
    await expect(page.getByRole("button", { name: "Hết chương 1" })).toHaveCount(0);

    // 1.1 still has no star: the title screen continues there (its lead-in, the prologue, was seen).
    await page.goto("/");
    await page.getByRole("button", { name: "TIẾP TỤC" }).click();
    await expect(page).toHaveURL(/#\/level\/1\.1$/);
  });
});

test("direct links: story gate before any gesture; unbuilt levels and unearned transitions go to the map", async ({ page }) => {
  await instrument(page);
  await page.goto("/#/story/prologue");
  const resume = page.getByRole("button", { name: "TIẾP TỤC ĐOẠN TRUYỆN" });
  await expect(resume).toBeFocused();
  expect(await events(page)).toEqual([]);
  await resume.click();
  await expect(page.getByRole("button", { name: /BỎ QUA/ })).toBeVisible();
  await expect.poll(() => events(page)).toContain("context");

  // No level of the chapter is unbuilt any more: an id outside it stands in.
  await page.goto("/#/level/2.1");
  await expect(page).toHaveURL(/#\/map$/);
  await page.goto("/#/story/teaser");
  await expect(page).toHaveURL(/#\/map$/);
  await page.goto("/#/story/after-1.4");
  await expect(page).toHaveURL(/#\/map$/);
  await page.goto("/#/level/1.4");
  await expect(page.getByRole("button", { name: "VÀO NHIỆM VỤ" })).toBeVisible();
  await page.goto("/#/level/1.7");
  await expect(page.getByRole("button", { name: "VÀO NHIỆM VỤ" })).toBeVisible();
  // A malformed escape is an unknown hash: title screen, not a crash.
  await page.goto("/#/story/%E0");
  await page.reload();
  await expect(page.getByRole("heading", { name: "MÃ CUỐI CÙNG" })).toBeVisible();
});
