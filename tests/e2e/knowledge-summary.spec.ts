import { readFileSync } from "node:fs";
import { expect, test } from "./fixtures";
import type { LevelDefinition } from "../../src/game/level-types";
import { enterMission } from "./helpers";

// "Việc cần làm" in the ECHO chat and the "Tổng kết kiến thức" screen, on level 1.1.
// Skipped until the level JSON carries the content (other content work fills it in).

const level = JSON.parse(readFileSync(new URL("../../src/levels/level-1-1.json", import.meta.url), "utf8")) as LevelDefinition;

/** 1.1 passed with one star, prologue and its transition already seen. */
const seedPassed = (page: import("@playwright/test").Page) =>
  page.addInitScript(() => {
    const progress = {
      schemaVersion: 1,
      levels: { "1.1": { draft: null, bestStars: 1, runs: 3, hintsOpened: 0, updatedAt: new Date().toISOString() } },
      story: { seen: ["prologue", "after-1.1"] },
    };
    localStorage.setItem("the-last-code:progress:v1", JSON.stringify(progress));
  });

test.describe("knowledge summary", () => {
  test.beforeEach(() => test.skip(!level.knowledge_summary, "SKIP: level-1-1.json chưa có knowledge_summary"));

  test("map Kiến thức opens the summary; it scrolls inside, the page does not; Enter returns to the map", async ({ page }) => {
    await seedPassed(page);
    await page.goto("/#/map");
    await page.getByRole("button", { name: /Kiến thức 1\.1/ }).click();
    await expect(page).toHaveURL(/#\/learn\/1\.1$/);
    const ks = level.knowledge_summary!;
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(ks.title);
    await expect(page.getByRole("heading", { name: "Ở màn sau" })).toBeVisible();
    if (ks.sections.some((s) => s.output !== undefined)) await expect(page.getByText("Kết quả:").first()).toBeAttached();
    if (ks.mistakes.length > 0) await expect(page.getByRole("heading", { name: "Lỗi bạn có thể đã gặp" })).toBeAttached();
    // No ECHO on this screen.
    await expect(page.locator(".echo-fab")).toHaveCount(0);
    const pageScrolls = await page.evaluate(() => document.documentElement.scrollHeight > window.innerHeight + 1);
    expect(pageScrolls).toBe(false);

    const next = page.getByRole("button", { name: "TIẾP TỤC" });
    await expect(next).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#\/map$/);
  });

  test("a deep link to the summary of a level without a star goes to the map", async ({ page }) => {
    await page.goto("/#/learn/1.1");
    await expect(page).toHaveURL(/#\/map$/);
  });
});

test.describe("task steps", () => {
  test.beforeEach(() => test.skip(!level.task_steps, "SKIP: level-1-1.json chưa có task_steps"));

  test("Việc cần làm continues ECHO's opening chat message, not in the mission column", async ({ page }) => {
    await page.goto("/#/level/1.1");
    await enterMission(page, { codeTab: false });
    // The mission column holds only the briefing and the objectives.
    await expect(page.locator(".col-mission .task-steps")).toHaveCount(0);
    // Until the chat is opened once, the entry bubble and the button point to it.
    const fab = page.locator(".echo-fab");
    await expect(page.locator(".echo-bubble")).toContainText("Mở để xem việc cần làm (E)");
    await expect(fab).toHaveClass(/points-steps/);

    await page.locator("body").press("e");
    const chat = page.locator(".echo-chat");
    await expect(chat).toBeFocused();
    const steps = chat.getByRole("region", { name: "Việc cần làm" });
    await expect(steps.locator("li")).toHaveCount(level.task_steps!.length);
    // Part of the "Vào nhiệm vụ" message: one chat turn, not a separate card.
    await expect(chat.locator(".echo-msg.is-entry").first().getByRole("region", { name: "Việc cần làm" })).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(chat).toBeHidden();
    await expect(fab).not.toHaveClass(/points-steps/);
  });
});
