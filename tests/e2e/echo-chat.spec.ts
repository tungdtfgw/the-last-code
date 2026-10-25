import { expect, test } from "@playwright/test";
import { LEVEL_URL, enterMission, openEchoChat } from "./helpers";

// ECHO lives in a floating chat. No Python needed: the entry line and hints come before any run.

test("ECHO chat: entry bubble after the intro, E opens, Esc closes, focus moves in and back", async ({ page }) => {
  await page.goto(LEVEL_URL);
  await enterMission(page, { codeTab: false });

  // After the intro, ECHO's entry line shows as a bubble, with the unread dot.
  const fab = page.locator(".echo-fab");
  await expect(page.locator(".echo-bubble")).toContainText("Cổng phía Bắc");
  await expect(fab).toHaveClass(/has-unread/);
  await expect(fab).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator(".echo-live")).toContainText("ECHO: Cổng phía Bắc");

  // E (outside the editor) opens the chat, focus moves into it, the line is read.
  await page.locator("body").press("e");
  const chat = page.locator(".echo-chat");
  await expect(chat).toBeVisible();
  await expect(chat).toBeFocused();
  await expect(fab).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator(".echo-bubble")).toHaveCount(0);
  await expect(page.locator(".echo-msg")).toHaveCount(1);
  await expect(page.locator(".echo-msg").first()).toContainText("Cổng phía Bắc");

  // Esc closes it and focus returns to the button; the dot is gone.
  await page.keyboard.press("Escape");
  await expect(chat).toBeHidden();
  await expect(fab).toBeFocused();
  await expect(fab).not.toHaveClass(/has-unread/);
});

test("ECHO chat: a hint decodes inside the chat and joins the conversation; the editor stays usable", async ({ page }) => {
  await page.goto(LEVEL_URL);
  await enterMission(page, { codeTab: false });
  await openEchoChat(page);

  await page.getByRole("button", { name: /Giải mã nhật ký gợi ý \(mức 1\/3\)/ }).click();
  await page.getByRole("button", { name: /Xác nhận: giải mã mức 1/ }).click();
  await expect(page.locator(".hints")).toContainText("1/3 đã giải mã");
  const hint = page.locator(".echo-msg.is-hint");
  await expect(hint).toContainText("Gợi ý mức 1");
  await expect(hint).toContainText("Nhìn mô phỏng sau khi chạy");
  await expect(page.locator(".echo-msg").last()).toHaveClass(/is-hint/);

  // Non-blocking: typing in the editor works with the chat open, and Esc there does not close it.
  if (await page.getByRole("button", { name: "Mã", exact: true }).isVisible()) {
    // Phone: the sheet covers the editor; close it first, as a player would.
    await page.getByRole("button", { name: "Đóng khung chat ECHO" }).click();
    await page.getByRole("button", { name: "Mã", exact: true }).click();
  }
  await page.locator(".cm-content .cm-line").nth(5).click();
  await page.keyboard.type("# ghi chu");
  await expect(page.locator(".cm-content")).toContainText("# ghi chu");
  if (await page.locator(".echo-fab").getAttribute("aria-expanded") === "true") {
    await page.keyboard.press("Escape");
    await expect(page.locator(".echo-chat")).toBeVisible();
  }

  // Reload: the decoded hint comes back in the chat.
  await page.waitForTimeout(700);
  await page.reload();
  await enterMission(page, { codeTab: false });
  await openEchoChat(page);
  await expect(page.locator(".echo-msg.is-hint")).toContainText("Nhìn mô phỏng sau khi chạy");
  await expect(page.locator(".hints")).toContainText("1/3 đã giải mã");
});
