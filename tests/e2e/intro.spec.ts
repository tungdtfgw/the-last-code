import { expect, newSignedInContext, test, type Page } from "./fixtures";
import { LEVEL_URL, enterMission, showTab } from "./helpers";

// Level intro and per-panel scrolling. No Python needed: these run before and around the Pyodide load.

const gate = (page: Page) => page.getByRole("button", { name: "VÀO NHIỆM VỤ" });
const briefingText = (page: Page) => page.locator(".briefing .panel-body").innerText();
const revealedCount = (page: Page) => page.locator(".objective.is-in").count();

test("intro: gate first, then the briefing types out, objectives lock in one by one, then ECHO speaks", async ({ page }) => {
  await page.goto(LEVEL_URL);
  await expect(gate(page)).toBeFocused();
  // Nothing is revealed behind the gate.
  expect((await briefingText(page)).trim()).toBe("");
  expect(await revealedCount(page)).toBe(0);
  await expect(page.locator(".alert-meter.is-pending")).toHaveCount(1);
  await expect(page.locator(".echo-fab .echo-portrait.is-asleep")).toHaveCount(1);
  await expect(page.locator(".echo-bubble")).toHaveCount(0);
  // Screen readers still get the whole briefing.
  await expect(page.locator(".briefing .sr-only")).toContainText("Máy quét chỉ nhận số");

  await gate(page).click();
  await expect(gate(page)).toHaveCount(0);
  await showTab(page, "Nhiệm vụ");

  // The briefing grows character by character, with objectives still hidden.
  const lengths: number[] = [];
  for (let i = 0; i < 6; i++) {
    lengths.push((await briefingText(page)).length);
    await page.waitForTimeout(250);
  }
  expect(lengths[0]).toBeLessThan(lengths[lengths.length - 1]);
  expect(new Set(lengths).size).toBeGreaterThan(3);
  expect(await revealedCount(page)).toBe(0);

  // Objectives then appear one at a time, in order, each with the lock-in animation.
  const seen: number[] = [];
  await expect
    .poll(
      async () => {
        const n = await revealedCount(page);
        if (seen[seen.length - 1] !== n) seen.push(n);
        return n;
      },
      { timeout: 15_000, intervals: [50] },
    )
    .toBe(3);
  expect(seen).toEqual(expect.arrayContaining([1, 2, 3]));
  const firstIn = page.locator(".objective.is-in").first();
  expect(await firstIn.evaluate((el) => getComputedStyle(el).animationName)).toBe("objective-in");
  await expect(page.locator(".objective").nth(0)).toContainText("ma_xac_thuc");

  // Alert meter powers up last, then ECHO wakes and starts talking.
  await expect(page.locator(".alert-meter.is-in")).toHaveCount(1);
  await expect(page.locator(".echo-fab .echo-portrait.is-asleep")).toHaveCount(0);
  await expect(page.locator(".echo-bubble .echo-line").first()).not.toBeEmpty();
  const full = await briefingText(page);
  expect(full).toContain("Chip Neural-ID thu hồi từ một người đã chết.");
  expect(full).toContain("Đưa chuỗi vào là báo động.");
});

test("intro: any key during the reveal shows everything at once", async ({ page }) => {
  await page.goto(LEVEL_URL);
  await gate(page).click();
  await expect(gate(page)).toHaveCount(0);
  await page.waitForTimeout(300);
  await page.keyboard.press("Escape");
  await expect(page.locator(".alert-meter.is-in")).toHaveCount(1, { timeout: 1000 });
  expect(await revealedCount(page)).toBe(3);
  await showTab(page, "Nhiệm vụ");
  expect(await briefingText(page)).toContain("Đưa chuỗi vào là báo động.");
});

test("intro with reduced motion: gate, then everything shown immediately", async ({ browser }) => {
  const context = await newSignedInContext(browser, { reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto(LEVEL_URL);
  await gate(page).click();
  await expect(page.locator(".alert-meter.is-in")).toHaveCount(1, { timeout: 1000 });
  expect(await revealedCount(page)).toBe(3);
  await showTab(page, "Nhiệm vụ");
  expect(await briefingText(page)).toContain("Đưa chuỗi vào là báo động.");
  await context.close();
});

test("each box scrolls on its own; the page never scrolls (desktop and tablet)", async ({ page }) => {
  test.skip(await page.evaluate(() => innerWidth < 768), "phone layout: one tab column scrolls instead");
  for (const size of [
    { width: 1280, height: 560 },
    { width: 900, height: 600 },
  ]) {
    await page.setViewportSize(size);
    // Same URL with a hash is a same-document navigation; reload for a fresh level start.
    await page.goto(LEVEL_URL);
    await page.reload();
    await enterMission(page);
    // ECHO's entry bubble floats over the foot of the mission column; close it so the wheel reaches the boxes.
    await page.getByRole("button", { name: "Đóng bong bóng ECHO" }).click();
    const pageScroll = () => page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
    expect(await pageScroll(), `page scroll at ${size.width}x${size.height}`).toBeLessThanOrEqual(0);

    // Every panel is its own scroll container, and at this height at least one actually overflows.
    const panels = page.locator(".col > .panel");
    const styles = await panels.evaluateAll((els) => els.map((e) => getComputedStyle(e).overflowY));
    expect(styles.every((o) => o === "auto" || o === "hidden"), styles.join(",")).toBe(true);
    const overflowing = page.locator(".col-mission > .panel").filter({ has: page.locator(".panel-head") });
    const scrollable = await overflowing.evaluateAll((els) => els.filter((e) => e.scrollHeight > e.clientHeight + 1).length);
    expect(scrollable).toBeGreaterThan(0);

    // Wheel over one box scrolls that box only.
    const target = (await overflowing.evaluateAll((els) => els.findIndex((e) => e.scrollHeight > e.clientHeight + 1))) as number;
    const box = overflowing.nth(target);
    const before = await page.locator(".col-mission > .panel").evaluateAll((els) => els.map((e) => e.scrollTop));
    await box.hover();
    await page.mouse.wheel(0, 400);
    await expect.poll(() => box.evaluate((e) => e.scrollTop)).toBeGreaterThan(0);
    const after = await page.locator(".col-mission > .panel").evaluateAll((els) => els.map((e) => e.scrollTop));
    after.forEach((top, i) => {
      if (i !== target) expect(top, `panel ${i} must not move`).toBe(before[i]);
    });
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
    // The heading stays visible (sticky) while its box scrolls.
    const [boxTop, titleTop] = await Promise.all([
      box.evaluate((e) => e.getBoundingClientRect().top),
      box.locator(".panel-title").evaluate((e) => e.getBoundingClientRect().top),
    ]);
    expect(titleTop).toBeGreaterThanOrEqual(boxTop);
    expect(titleTop - boxTop).toBeLessThan(40);
  }
});
