import { expect, test, type Page } from "./fixtures";
import { realChapterJson } from "../content-fixture";

// Chapter 2 in the shell: an old player continues into its opening, the map shows one
// chapter per page with a chapter row, and the end of chapter 2 goes back to the map.
// No Python: progress is seeded as old local progress, which the game folds into the account.

const CHAPTER_1 = ["1.1", "1.2", "1.3", "1.4", "1.5", "1.6", "1.7"];
const CHAPTER_2 = ["2.1", "2.2", "2.3", "2.4", "2.5", "2.6", "2.7"];
const CHAPTER_1_SEEN = ["prologue", ...CHAPTER_1.map((id) => `after-${id}`), "teaser"];

/** Three stars on `ids`, `seen` stories seen, as local progress from before accounts. */
const seed = (page: Page, ids: string[], seen: string[]) =>
  page.addInitScript(
    ({ ids, seen }) => {
      const levels = Object.fromEntries(
        ids.map((id) => [id, { draft: null, bestStars: 3, runs: 1, hintsOpened: 0, updatedAt: new Date().toISOString() }]),
      );
      localStorage.setItem("the-last-code:progress:v1", JSON.stringify({ schemaVersion: 1, levels, story: { seen } }));
    },
    { ids, seen },
  );

const node = (page: Page, id: string) => page.locator(`.map-node[data-level="${id}"]`);

test("an old player who saw the end of chapter 1: title TIẾP TỤC opens chapter 2's opening, then the 2.1 gate", async ({ page }) => {
  const prologue = realChapterJson(2).prologue as { text: string }[];
  await seed(page, CHAPTER_1, CHAPTER_1_SEEN);
  await page.goto("/");
  const resume = page.getByRole("button", { name: "TIẾP TỤC", exact: true });
  await expect(resume).toBeFocused();
  await resume.click();

  await expect(page).toHaveURL(/#\/story\/prologue-2$/);
  await expect(page.locator(".story [aria-live]")).toContainText(prologue[0].text);
  await page.keyboard.press("Escape");
  await expect(page).toHaveURL(/#\/level\/2\.1$/);
  await expect(page.getByRole("button", { name: "VÀO NHIỆM VỤ" })).toBeVisible();
});

test("chapter 2's opening stays closed until 1.7 has a star", async ({ page }) => {
  await seed(page, CHAPTER_1.slice(0, 6), CHAPTER_1_SEEN.slice(0, 7));
  await page.goto("/#/story/prologue-2");
  await expect(page).toHaveURL(/#\/map$/);
  await page.goto("/#/story/teaser-2");
  await expect(page).toHaveURL(/#\/map$/);
});

test("the map: a chapter row, chapter 2 with seven nodes, the evasion rulebook and 0/21; back to chapter 1", async ({ page }) => {
  await seed(page, CHAPTER_1, CHAPTER_1_SEEN);
  await page.goto("/#/map/2");
  const row = page.getByRole("navigation", { name: "Chương" });
  await expect(row.getByRole("button")).toHaveCount(2);
  await expect(row.getByRole("button", { name: /Chương 2/ })).toHaveAttribute("aria-current", "page");
  await expect(page.locator(".map-node")).toHaveCount(7);
  await expect(page.getByText("TÍN HIỆU HỎNG")).toHaveCount(0);
  await expect(node(page, "2.1")).toContainText("TIẾP THEO");
  await expect(node(page, "2.2")).toContainText("Cần 1 sao ở 2.1");
  await expect(page.getByRole("heading", { name: "Bộ luật né" })).toBeVisible();
  await expect(page.getByTestId("chapter-stars")).toHaveText("0/21");

  // #/map opens the chapter with the next level.
  await page.goto("/#/map");
  await expect(node(page, "2.1")).toBeVisible();

  await row.getByRole("button", { name: /Chương 1/ }).click();
  await expect(page).toHaveURL(/#\/map\/1$/);
  await expect(node(page, "1.1")).toBeVisible();
  await expect(page.getByTestId("chapter-stars")).toHaveText("21/21");
});

test("chapter 2 cleared: after-2.7 → the end of chapter 2, which only goes back to the map", async ({ page }) => {
  await seed(page, [...CHAPTER_1, ...CHAPTER_2], [...CHAPTER_1_SEEN, "prologue-2", ...CHAPTER_2.slice(0, 6).map((id) => `after-${id}`)]);
  await page.goto("/#/story/after-2.7");
  await page.getByRole("button", { name: "TIẾP TỤC ĐOẠN TRUYỆN" }).click();
  await page.keyboard.press("Escape");

  await expect(page).toHaveURL(/#\/story\/teaser-2$/);
  await page.keyboard.press("Escape");
  // No chapter after this one is built: no TIẾP TỤC.
  await expect(page.getByRole("button", { name: "TIẾP TỤC", exact: true })).toHaveCount(0);
  const back = page.getByRole("button", { name: "VỀ BẢN ĐỒ" });
  await expect(back).toBeFocused();
  await page.keyboard.press("Enter");

  await expect(page).toHaveURL(/#\/map(\/2)?$/);
  await expect(page.getByTestId("chapter-stars")).toHaveText("21/21");
  await expect(page.getByRole("button", { name: "Hết chương 2" })).toBeVisible();
});
