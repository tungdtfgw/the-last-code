import { ADMIN_USERNAME, createAccount, expect, newSignedInContext, test, type Page } from "./fixtures";

// The ranking (`#/rank`): the player's row shows the furthest level of their unbroken
// starred run and its stars; an admin hides an account and it loses its place.
// The e2e database is shared, so other players may be above or below; only the
// player's own row (`data-me`) is checked. Hiding writes to it, so this runs on chromium only.

test.describe.configure({ mode: "serial" });
test.beforeEach(({}, info) => test.skip(info.project.name !== "chromium", "SKIP: ghi vào CSDL e2e dùng chung, chỉ chạy trên chromium"));

/** Stars per level as local progress from before accounts; the game folds it into the account on entry. */
const seed = (page: Page, stars: Record<string, number>) =>
  page.addInitScript((stars) => {
    const levels = Object.fromEntries(
      Object.entries(stars).map(([id, s]) => [id, { draft: null, bestStars: s, runs: 1, hintsOpened: 0, updatedAt: new Date().toISOString() }]),
    );
    localStorage.setItem("the-last-code:progress:v1", JSON.stringify({ schemaVersion: 1, levels, story: { seen: ["prologue"] } }));
  }, stars);

/** Every level of both chapters at three stars: the top of the board, so the admin's list (top 50) holds the player. */
const ALL_CLEAR = Object.fromEntries(
  ["1.1", "1.2", "1.3", "1.4", "1.5", "1.6", "1.7", "2.1", "2.2", "2.3", "2.4", "2.5", "2.6", "2.7"].map((id) => [id, 3]),
);

const myRow = (page: Page) => page.locator(".rank-row[data-me]");

test("the title's XẾP HẠNG shows the player at the end of their unbroken run, and QUAY LẠI returns", async ({ page, account }) => {
  await seed(page, { "1.1": 3, "1.2": 2, "1.4": 3 }); // 1.3 has no star: the run stops at 1.2
  await page.goto("/");
  await page.getByRole("button", { name: "XẾP HẠNG" }).click();
  await expect(page).toHaveURL(/#\/rank$/);
  await expect(myRow(page)).toContainText(account.username);
  await expect(myRow(page)).toContainText("1.2 ·");
  await expect(myRow(page).getByRole("img", { name: "2 trên 3 sao" })).toBeVisible();
  await page.getByRole("button", { name: "QUAY LẠI" }).click();
  await expect(page).toHaveURL(/#\/$/);
});

test("the map's XẾP HẠNG leads back to the map", async ({ page }) => {
  await seed(page, { "1.1": 1 });
  await page.goto("/#/map");
  await page.getByRole("button", { name: "XẾP HẠNG" }).click();
  await expect(page).toHaveURL(/#\/rank$/);
  await page.getByRole("button", { name: "QUAY LẠI" }).click();
  await expect(page).toHaveURL(/#\/map$/);
});

test("an admin hides a player: the player loses their place, the admin still sees them as ẨN", async ({ browser }) => {
  const player = await createAccount();
  const playerContext = await newSignedInContext(browser, {}, player);
  const playerPage = await playerContext.newPage();
  await seed(playerPage, ALL_CLEAR);
  await playerPage.goto("/#/rank");
  await expect(myRow(playerPage)).toContainText(player.username);

  const adminContext = await newSignedInContext(browser, {}, await createAccount({ username: ADMIN_USERNAME }));
  const adminPage = await adminContext.newPage();
  await adminPage.goto("/#/rank");
  const row = adminPage.locator(".rank-row", { hasText: player.username });
  await row.getByRole("button", { name: "ẨN" }).click();
  await expect(row).toHaveAttribute("data-hidden", "true");
  await expect(row.getByRole("button", { name: "HIỆN" })).toBeVisible();

  await playerPage.reload();
  await expect(playerPage.getByText("Bạn chưa có hạng.")).toBeVisible();
  await expect(myRow(playerPage)).toHaveCount(0);
  await playerContext.close();
  await adminContext.close();
});
