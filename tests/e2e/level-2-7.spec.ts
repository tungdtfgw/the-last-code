import { expect, test, type Page } from "./fixtures";
import { PYODIDE_MODULE_URL } from "../../src/engine/pyodide-config";
import { realChapterJson, realLevelJson } from "../content-fixture";
import { continueFromResults, gotoLevel, replaceEditableCode, runAndWait, waitForPythonReady } from "./helpers";

// Boss 2.7 end to end (real Pyodide): starter code → three stars → chapter 2 summary →
// after-2.7 (fragment card, two fragments lit) → the end of chapter 2 → map.

let online = true;
test.beforeAll(async () => {
  try {
    const res = await fetch(PYODIDE_MODULE_URL, { method: "HEAD" });
    online = res.ok;
  } catch {
    online = false;
  }
});
test.beforeEach(() => test.skip(!online, "SKIP: offline (không tải được Pyodide từ cdn.jsdelivr.net)"));

/** The starter code with its five planted faults fixed; the editable part starts at line 6. */
const FROM_LINE = 6;
const FIXES: Record<number, string> = {
  7: "khoang_cach = int(input())",
  11: "trong_tam = khoang_cach <= tam_quet",
  15: "if khoang_cach < 20:",
  16: '    print("MUC: BAO DONG")',
  17: "elif khoang_cach < 50:",
  18: '    print("MUC: NGUY HIEM")',
  19: "elif khoang_cach < 100:",
  20: '    print("MUC: CANH GIAC")',
  32: 'print(f"LENH DRONE: {lenh_drone}")',
  35: "if trong_tam and (camera_bat or den_pha):",
};

const CHAPTER_1 = ["1.1", "1.2", "1.3", "1.4", "1.5", "1.6", "1.7"];
const CHAPTER_2_BEFORE_BOSS = ["2.1", "2.2", "2.3", "2.4", "2.5", "2.6"];

const terminal = (page: Page) => page.locator(".terminal-scroll");

test("boss: starter code breaks in phase 1, the fixed draft passes, chapter 2 ends on the map", async ({ page }) => {
  test.setTimeout(240_000);
  // Every earlier level starred and every earlier story seen, so the boss is the next step.
  await page.addInitScript(
    ({ ids, seen }) => {
      const levels = Object.fromEntries(
        ids.map((id) => [id, { draft: null, bestStars: 3, runs: 1, hintsOpened: 0, updatedAt: new Date().toISOString() }]),
      );
      localStorage.setItem("the-last-code:progress:v1", JSON.stringify({ schemaVersion: 1, levels, story: { seen } }));
    },
    {
      ids: [...CHAPTER_1, ...CHAPTER_2_BEFORE_BOSS],
      seen: [
        "prologue",
        ...CHAPTER_1.map((id) => `after-${id}`),
        "teaser",
        "prologue-2",
        ...CHAPTER_2_BEFORE_BOSS.map((id) => `after-${id}`),
      ],
    },
  );
  const level = realLevelJson("2.7");
  const teaser = realChapterJson(2).teaser as { text: string }[];
  const solution = (level.starter_code as string)
    .split("\n")
    .map((l, i) => FIXES[i + 1] ?? l)
    .slice(FROM_LINE - 1)
    .join("\n");

  await gotoLevel(page, "2.7");
  await waitForPythonReady(page);

  await runAndWait(page);
  await expect(terminal(page)).toContainText("TÌNH HUỐNG 1/4");
  await expect(terminal(page)).toContainText("TypeError");
  await expect(terminal(page)).not.toContainText("TÌNH HUỐNG 2/4");

  await replaceEditableCode(page, solution, FROM_LINE);
  await runAndWait(page);
  const dialog = page.locator("dialog[open]");
  await expect(dialog.locator(".results-stars .star-row").first()).toHaveAttribute("aria-label", "3 trên 3 sao");
  // The boss adds no rule to the evasion set.
  await expect(dialog).not.toContainText("Đã thu");

  await continueFromResults(page, "2.7");
  await expect(page).toHaveURL(/#\/story\/after-2\.7$/);
  await expect(page.locator(".story [aria-live]")).toHaveText(level.outro);

  // Step through to the fragment card: no rule card on the way, two of eight fragments lit.
  const lit = page.locator(".city-fragments.is-found circle.is-lit");
  for (let i = 0; i < 60 && !(await lit.count()); i++) {
    expect(await page.locator(".story").textContent()).not.toContain("BỘ LUẬT NÉ ·");
    await page.keyboard.press("Space");
    await page.waitForTimeout(80);
  }
  await expect(lit).toHaveCount(2);
  await expect(page.locator(".story")).toContainText("2/8");
  await page.keyboard.press("Escape");

  await expect(page).toHaveURL(/#\/story\/teaser-2$/);
  await expect(page.locator(".story [aria-live]")).toContainText(teaser[0].text);
  await page.keyboard.press("Escape");
  // No chapter 3 yet: the end screen only leads back to the map.
  await expect(page.getByRole("button", { name: "TIẾP TỤC" })).toHaveCount(0);
  const toMap = page.getByRole("button", { name: "VỀ BẢN ĐỒ" });
  await expect(toMap).toBeFocused();
  await page.keyboard.press("Enter");

  await expect(page).toHaveURL(/#\/map(\/2)?$/);
  await expect(page.getByTestId("chapter-stars")).toHaveText(/\/21$/);
});
