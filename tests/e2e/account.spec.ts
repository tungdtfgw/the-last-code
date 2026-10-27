import { test as plain } from "@playwright/test";
import {
  BASE_URL,
  PASSWORD,
  createAccount,
  expect,
  latestMail,
  mailCount,
  newSignedInContext,
  test,
  uniqueName,
  type Page,
} from "./fixtures";
import { L11_FROM_LINE, L11_SOLUTION_3_STARS, enterMission, replaceEditableCode, runAndWait, waitForPythonReady } from "./helpers";

const PROGRESS_KEY = "the-last-code:progress:v1";

async function login(page: Page, username: string, password = PASSWORD) {
  await page.goto("/#/login");
  await page.getByLabel("Username").fill(username);
  await page.getByLabel("Mật khẩu").fill(password);
  await page.getByRole("button", { name: "ĐĂNG NHẬP" }).click();
}

/** Opens a mail link on the preview server (links carry APP_ORIGIN, which is the same origin in e2e). */
const open = (page: Page, link: string) => page.goto(link.replace(/^https?:\/\/[^/]+/, BASE_URL));

// Signed-out tests use the plain Playwright `test`: no account, no cookie.

plain("signed out, a game route sends you to the login screen", async ({ page }) => {
  await page.goto("/#/level/1.1");
  await expect(page).toHaveURL(/#\/login$/);
  await expect(page.getByRole("heading", { name: "Đăng nhập" })).toBeVisible();
});

plain("register in the UI, open the mail link, sign in and land on the title", async ({ page }) => {
  const username = uniqueName("ui");
  const email = `${username}@e2e.test`;
  await page.goto("/#/register");
  await page.getByLabel("Username").fill(username);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Mật khẩu", { exact: true }).fill(PASSWORD);
  await page.getByLabel("Nhập lại mật khẩu").fill(PASSWORD);
  await page.getByRole("button", { name: "ĐĂNG KÝ" }).click();
  await expect(page.getByRole("heading", { name: "Kiểm tra email" })).toBeVisible();
  await expect(page.getByText(email)).toBeVisible();

  await open(page, (await latestMail(email)).link);
  await expect(page.getByRole("heading", { name: "Tài khoản đã kích hoạt" })).toBeVisible();
  // The token leaves the address bar.
  await expect(page).toHaveURL(/#\/activate$/);
  await page.getByRole("button", { name: "ĐĂNG NHẬP" }).click();
  await login(page, username);
  await expect(page.getByText(`Đang chơi: ${username}`)).toBeVisible();
});

plain("signing in before activation offers to resend the mail", async ({ page }) => {
  const account = await createAccount({ activate: false });
  const before = mailCount(account.email);
  await login(page, account.username);
  await expect(page.getByText("Tài khoản chưa kích hoạt")).toBeVisible();
  await page.getByRole("button", { name: "Gửi lại thư kích hoạt" }).click();
  await expect(page.getByText("Đã gửi lại thư kích hoạt")).toBeVisible();
  expect(mailCount(account.email)).toBe(before + 1);
});

test("a star earned on one browser shows on another after signing in again", async ({ page, account, browser }) => {
  test.setTimeout(180_000);
  await page.goto("/#/level/1.1");
  await enterMission(page);
  await waitForPythonReady(page);
  await replaceEditableCode(page, L11_SOLUTION_3_STARS, L11_FROM_LINE);
  await runAndWait(page);
  await expect(page.locator("dialog[open]")).toBeVisible({ timeout: 30_000 });
  await page.goto("/#/account");
  await page.getByRole("button", { name: "ĐĂNG XUẤT" }).click();
  await expect(page).toHaveURL(/#\/login$/);

  const other = await browser.newContext();
  const page2 = await other.newPage();
  await login(page2, account.username);
  await expect(page2.getByText(`Đang chơi: ${account.username}`)).toBeVisible();
  await page2.goto("/#/map");
  await expect(page2.locator('[data-level="1.1"] .star-row')).toHaveAttribute("aria-label", "3 trên 3 sao");
  await other.close();
});

test("old progress on this browser joins the account and leaves localStorage", async ({ context, page }) => {
  await context.addInitScript((key) => {
    if (sessionStorage.getItem("seeded")) return;
    sessionStorage.setItem("seeded", "1");
    localStorage.setItem(key, JSON.stringify({ schemaVersion: 1, levels: { "1.1": { bestStars: 2, runs: 4 } }, story: { seen: ["prologue"] } }));
  }, PROGRESS_KEY);
  await page.goto("/#/");
  await expect(page.getByRole("button", { name: "TIẾP TỤC" })).toBeVisible();
  expect(await page.evaluate((key) => localStorage.getItem(key), PROGRESS_KEY)).toBeNull();
  const progress = await page.evaluate(async () => (await fetch("/api/progress")).json());
  expect(progress.levels["1.1"]).toMatchObject({ bestStars: 2, runs: 4 });
  expect(progress.story.seen).toContain("prologue");
});

plain("forgot password: the reset link sets a new password and signs other browsers out", async ({ page, browser }) => {
  const account = await createAccount();
  const elsewhere = await newSignedInContext(browser, {}, account);
  const otherPage = await elsewhere.newPage();
  await otherPage.goto("/#/");
  await expect(otherPage.getByText(`Đang chơi: ${account.username}`)).toBeVisible();

  await page.goto("/#/forgot");
  await page.getByLabel("Username hoặc email").fill(account.email);
  await page.getByRole("button", { name: "GỬI LINK" }).click();
  await expect(page.getByText("Nếu tài khoản tồn tại")).toBeVisible();
  const mail = await latestMail(account.email);
  expect(mail.link).toContain("/#/reset/");
  await open(page, mail.link);
  await page.getByLabel("Mật khẩu mới").fill("mat-khau-moi-1");
  await page.getByLabel("Nhập lại mật khẩu").fill("mat-khau-moi-1");
  await page.getByRole("button", { name: "ĐẶT MẬT KHẨU" }).click();
  await expect(page.getByRole("heading", { name: "Đã đặt mật khẩu mới" })).toBeVisible();

  await login(page, account.username);
  await expect(page.getByText("Sai username hoặc mật khẩu.")).toBeVisible();
  await login(page, account.username, "mat-khau-moi-1");
  await expect(page.getByText(`Đang chơi: ${account.username}`)).toBeVisible();

  // The other browser finds out on its next progress write: skipping the prologue marks it seen.
  await otherPage.getByRole("button", { name: "BẮT ĐẦU" }).click();
  await expect(otherPage).toHaveURL(/#\/story\/prologue$/);
  await otherPage.keyboard.press("Escape");
  await expect(otherPage).toHaveURL(/#\/login$/);
  await expect(otherPage.getByText("Phiên đăng nhập đã hết")).toBeVisible();
  await elsewhere.close();
});

test("account screen: change password by email sends a reset mail", async ({ page, account }) => {
  const before = mailCount(account.email);
  await page.goto("/#/");
  await page.getByRole("button", { name: "TÀI KHOẢN" }).click();
  await page.getByRole("button", { name: "Đổi mật khẩu qua email" }).click();
  await expect(page.getByText("Đã gửi link đổi mật khẩu")).toBeVisible();
  expect(mailCount(account.email)).toBe(before + 1);
  expect((await latestMail(account.email)).link).toContain("/#/reset/");
});

for (const size of [
  { width: 1280, height: 800 },
  { width: 360, height: 740 },
]) {
  plain(`login and register fit ${size.width}×${size.height} without page scroll`, async ({ page }) => {
    await page.setViewportSize(size);
    for (const hash of ["#/login", "#/register"]) {
      await page.goto(`/${hash}`);
      await expect(page.locator(".auth-panel")).toBeVisible();
      const fits = await page.evaluate(
        () => document.documentElement.scrollHeight <= innerHeight && document.querySelector(".auth-screen")!.scrollHeight <= innerHeight,
      );
      expect(fits, hash).toBe(true);
    }
  });
}
