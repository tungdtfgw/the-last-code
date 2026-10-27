import type { Browser, Page } from "@playwright/test";
import { realLevelJson } from "../content-fixture";
import { ADMIN_USERNAME, createAccount, expect, newSignedInContext, test } from "./fixtures";
import { enterMission } from "./helpers";

// The admin page (`#/admin`): only `ADMIN_USERNAMES` gets in; saved text reaches the game after a reload.
// Every save here goes to the shared e2e database, so the spec runs on one project, in order,
// and puts the migrated text of 1.1 (revision 1 in the fresh database) back at the end.

const level11 = realLevelJson("1.1");
const level14 = realLevelJson("1.4");

test.describe.configure({ mode: "serial" });
test.beforeEach(({}, info) => test.skip(info.project.name !== "chromium", "SKIP: lưu vào CSDL e2e dùng chung, chỉ chạy trên chromium"));

const adminContext = async (browser: Browser) => newSignedInContext(browser, {}, await createAccount({ username: ADMIN_USERNAME }));

async function openDoc(page: Page, doc: string) {
  await page.goto(`/#/admin/${doc}`);
  await expect(page.getByRole("button", { name: "Lưu", exact: true })).toBeVisible();
}

const input = (page: Page, path: string) => page.locator(`[data-path="${path}"]`);
const save = (page: Page) => page.getByRole("button", { name: "Lưu", exact: true }).click();

test.afterAll(async ({ browser }, info) => {
  if (info.project.name !== "chromium") return;
  // Put the migrated text (revision 1) back over the latest revision, so other specs read 1.1 as shipped.
  const context = await adminContext(browser);
  const page = await context.newPage();
  await page.goto("/#/admin");
  await page.evaluate(async () => {
    const doc = await (await fetch("/api/admin/content/level/1.1")).json();
    const first = await (await fetch("/api/admin/content/level/1.1/history/1")).json();
    await fetch("/api/admin/content/level/1.1", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ baseRevision: doc.revision, text: first.text }),
    });
  });
  await context.close();
});

test("a player sees no admin entry, is sent to the title from #/admin, and the API answers 403", async ({ page }) => {
  await page.goto("/#/account");
  await expect(page.getByRole("heading", { name: "Tài khoản" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Quản lý kịch bản" })).toHaveCount(0);
  await page.goto("/#/admin");
  await expect(page).toHaveURL(/#\/$/);
  expect(await page.evaluate(async () => (await fetch("/api/admin/content")).status)).toBe(403);
});

test("the admin edits the 1.1 briefing; the game shows it after a reload", async ({ browser }) => {
  const context = await adminContext(browser);
  const page = await context.newPage();
  await page.goto("/#/account");
  await page.getByRole("button", { name: "Quản lý kịch bản" }).click();
  await expect(page).toHaveURL(/#\/admin$/);
  await expect(page.getByRole("button", { name: /^Chương 1/ })).toBeVisible();
  await page.getByRole("button", { name: /^1\.1 ·/ }).click();
  await expect(page).toHaveURL(/#\/admin\/level\/1\.1$/);

  const briefing = "LỜI DẪN E2E: trạm R-17 đang chờ tín hiệu.";
  await input(page, "briefing").fill(briefing);
  await expect(page.getByText("● 1 ô đã sửa")).toBeVisible();
  await save(page);
  await expect(page.getByText(/^Đã lưu bản \d+\.$/)).toBeVisible();

  await page.goto("/#/level/1.1");
  await page.reload();
  await enterMission(page);
  await expect(page.locator(".briefing .sr-only")).toContainText(briefing);
  await context.close();
});

test("a reaction that says an answer is refused under its own field and nothing is saved", async ({ browser }) => {
  const context = await adminContext(browser);
  const page = await context.newPage();
  await openDoc(page, "level/1.4");
  const before = await page.locator(".admin-meta").innerText();
  const answer = String(level14.tests[0].expected[Object.keys(level14.tests[0].expected)[0]]);
  await input(page, "reactions.wrong_value").fill(`Thử ${answer} xem.`);
  await save(page);
  const field = input(page, "reactions.wrong_value");
  await expect(field).toHaveAttribute("aria-invalid", "true");
  await expect(field).toBeFocused();
  await expect(page.locator(".admin-item", { has: field }).locator(".admin-errors")).toContainText(answer);
  await page.reload();
  await expect(page.locator(".admin-meta")).toHaveText(before);
  await context.close();
});

test("two admins on one document: the later save gets the conflict banner", async ({ browser }) => {
  const a = await adminContext(browser);
  const b = await adminContext(browser);
  const pageA = await a.newPage();
  const pageB = await b.newPage();
  await openDoc(pageA, "level/1.1");
  await openDoc(pageB, "level/1.1");
  await input(pageA, "briefing").fill(`${level11.briefing} (A)`);
  await save(pageA);
  await expect(pageA.getByText(/^Đã lưu bản \d+\.$/)).toBeVisible();
  await input(pageB, "briefing").fill(`${level11.briefing} (B)`);
  await save(pageB);
  await expect(pageB.getByText(/Có người vừa lưu bản \d+/)).toBeVisible();
  await pageB.getByRole("button", { name: "Tải bản mới nhất" }).click();
  await expect(input(pageB, "briefing")).toHaveValue(`${level11.briefing} (A)`);
  await a.close();
  await b.close();
});

test("history: the migrated revision loaded into the form and saved brings the shipped text back", async ({ browser }) => {
  const context = await adminContext(browser);
  const page = await context.newPage();
  await openDoc(page, "level/1.1");
  await input(page, "briefing").fill("Bản sẽ bị thay.");
  await save(page);
  await expect(page.getByText(/^Đã lưu bản \d+\.$/)).toBeVisible();

  await page.getByRole("button", { name: "Lịch sử" }).click();
  const history = page.getByRole("complementary", { name: "Lịch sử các bản" });
  // Revision 1 is the text the migration gave the fresh database.
  const first = history.getByRole("listitem").filter({ hasText: /^Bản 1 · migration ·/ });
  await first.getByRole("button", { name: "Nạp vào form" }).click();
  await expect(input(page, "briefing")).toHaveValue(level11.briefing);
  await save(page);
  await expect(page.getByText(/^Đã lưu bản \d+\.$/)).toBeVisible();
  await page.reload();
  await expect(input(page, "briefing")).toHaveValue(level11.briefing);
  await context.close();
});
