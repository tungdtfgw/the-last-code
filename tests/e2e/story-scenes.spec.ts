import { expect, newSignedInContext, test, type Page } from "./fixtures";

// Story backdrops: drawn places, the crossfade between backdrops, and the still
// transcript for reduced motion.

const layers = (page: Page) => page.locator(".story-backdrop .scene-layer");

async function openPrologue(page: Page) {
  await page.goto("/#/story/prologue");
  await page.getByRole("button", { name: "TIẾP TỤC ĐOẠN TRUYỆN" }).click();
  await expect(page.getByRole("button", { name: /BỎ QUA/ })).toBeVisible();
}

/** Space until the given backdrop is on top (each beat: finish typing, then move on). */
async function advanceTo(page: Page, scene: string) {
  const top = page.locator(`.story-backdrop .scene-layer:not(.is-leaving)[data-scene="${scene}"]`);
  for (let i = 0; i < 40 && !(await top.count()); i++) {
    await page.keyboard.press("Space");
    await page.waitForTimeout(80);
  }
  await expect(top).toHaveCount(1);
}

test("the prologue moves from the city to the drawn basement, crossfading", async ({ page }) => {
  await openPrologue(page);
  await expect(layers(page)).toHaveCount(1);
  await expect(layers(page).first()).toHaveAttribute("data-scene", "thanh-pho");

  await advanceTo(page, "tang-ham");
  await expect(page.locator('.scene-layer[data-scene="tang-ham"] svg.sa-tang-ham')).toBeVisible();
  // The old backdrop goes once the new one has faded in.
  await expect(layers(page)).toHaveCount(1);
});

test("after-1.7 opens on the Control Gate and the 0xA7 card tears the frame", async ({ page }) => {
  await page.addInitScript(() => {
    const levels = Object.fromEntries(
      ["1.1", "1.2", "1.3", "1.4", "1.5", "1.6", "1.7"].map((id) => [
        id,
        { draft: null, bestStars: 3, runs: 1, hintsOpened: 0, updatedAt: new Date().toISOString() },
      ]),
    );
    localStorage.setItem("the-last-code:progress:v1", JSON.stringify({ schemaVersion: 1, levels, story: { seen: ["prologue"] } }));
  });
  await page.goto("/#/story/after-1.7");
  await page.getByRole("button", { name: "TIẾP TỤC ĐOẠN TRUYỆN" }).click();
  await expect(page.locator('.scene-layer[data-scene="cong-kiem-soat"]')).toHaveCount(1);
  for (let i = 0; i < 40 && !(await page.locator(".fx-signal").count()); i++) {
    await page.keyboard.press("Space");
    await page.waitForTimeout(80);
  }
  await expect(page.locator(".fx-signal")).toHaveCount(1);
});

test("reduced motion: the transcript sits on the story's first backdrop, still", async ({ browser }) => {
  const context = await newSignedInContext(browser, { reducedMotion: "reduce" });
  const page = await context.newPage();
  await openPrologue(page);
  await expect(page.locator(".story-backdrop.is-still")).toBeVisible();
  await expect(layers(page)).toHaveCount(1);
  await expect(layers(page).first()).toHaveAttribute("data-scene", "thanh-pho");
  await expect(page.locator(".fx-signal, .fx-scan, .fx-omni, .is-focus")).toHaveCount(0);
  await context.close();
});
