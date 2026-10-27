import { expect, test, type Page } from "./fixtures";
import { PYODIDE_MODULE_URL } from "../../src/engine/pyodide-config";
import { LEVEL_URL, SOLUTION_67, replaceEditableCode, runAndWait, waitForPythonReady } from "./helpers";

let online = true;
test.beforeAll(async () => {
  try {
    online = (await fetch(PYODIDE_MODULE_URL, { method: "HEAD" })).ok;
  } catch {
    online = false;
  }
});
test.beforeEach(() => test.skip(!online, "SKIP: offline (không tải được Pyodide từ cdn.jsdelivr.net)"));

type Probe = { event: string; at: number }[];
const CUES = new Set([
  "key_blip",
  "terminal_line",
  "run",
  "scan_pass",
  "scan_reject",
  "locked_blocked",
  "alarm",
  "siren",
  "gate_open",
  "star",
  "echo_voice",
  "teletype",
  "objective_lock",
  "pulse",
  "glitch",
]);

/** Instrument before any app code runs: the probe array and an AudioContext constructor counter. */
async function instrument(page: Page) {
  await page.addInitScript(() => {
    const w = window as unknown as Record<string, unknown>;
    w.__TLC_AUDIO_PROBE__ = [];
    w.__ctxCount = 0;
    const Orig = (window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext) as typeof AudioContext;
    if (!Orig) return;
    class Counted extends Orig {
      constructor(...args: ConstructorParameters<typeof AudioContext>) {
        super(...args);
        w.__ctxCount = (w.__ctxCount as number) + 1;
        w.__lastCtx = this;
      }
    }
    window.AudioContext = Counted;
  });
}
const probe = (page: Page) => page.evaluate(() => (window as unknown as { __TLC_AUDIO_PROBE__: Probe }).__TLC_AUDIO_PROBE__.slice());
const events = async (page: Page, since = 0) => (await probe(page)).filter((e) => e.at >= since).map((e) => e.event);
/** First user gesture is the level's entry gate: a touch tap on touch devices (the iOS-style unlock path), a mouse click otherwise. */
async function firstGesture(page: Page) {
  const touch = await page.evaluate(() => navigator.maxTouchPoints > 0);
  const gate = page.getByRole("button", { name: "VÀO NHIỆM VỤ" });
  if (touch) await gate.tap();
  else await gate.click();
}

test("sound: nothing before a gesture, then every cue fires; mute silences and persists (E3, E4)", async ({ page }) => {
  await instrument(page);
  await page.goto(LEVEL_URL);
  await waitForPythonReady(page);
  // No AudioContext and no sound before the first user gesture.
  expect(await page.evaluate(() => (window as unknown as { __ctxCount: number }).__ctxCount)).toBe(0);
  expect(await probe(page)).toEqual([]);

  await firstGesture(page);
  await expect.poll(() => events(page)).toEqual(expect.arrayContaining(["context", "unlock", "ambient"]));
  // Level intro: the briefing types with teletype ticks, each objective locks in with its own cue, then ECHO speaks.
  await expect(page.locator(".alert-meter.is-in")).toHaveCount(1, { timeout: 15_000 });
  const intro = await events(page);
  expect(intro.filter((e) => e === "teletype").length).toBeGreaterThan(20);
  expect(intro.filter((e) => e === "objective_lock")).toHaveLength(3);
  await expect.poll(() => events(page)).toContain("echo_voice");
  const order = await events(page);
  expect(order.indexOf("teletype")).toBeLessThan(order.indexOf("objective_lock"));
  expect(order.lastIndexOf("objective_lock")).toBeLessThan(order.indexOf("echo_voice"));
  if (await page.getByRole("button", { name: "Mã", exact: true }).isVisible()) await page.getByRole("button", { name: "Mã", exact: true }).click();
  expect(await page.evaluate(() => (window as unknown as { __lastCtx: AudioContext }).__lastCtx.state)).toBe("running");

  // Hidden tab suspends audio; visible again resumes it (E6).
  const setHidden = (hidden: boolean) =>
    page.evaluate((hidden) => {
      Object.defineProperty(document, "hidden", { configurable: true, get: () => hidden });
      Object.defineProperty(document, "visibilityState", { configurable: true, get: () => (hidden ? "hidden" : "visible") });
      document.dispatchEvent(new Event("visibilitychange"));
    }, hidden);
  const ctxState = () => page.evaluate(() => (window as unknown as { __lastCtx: AudioContext }).__lastCtx.state);
  await setHidden(true);
  await expect.poll(ctxState).toBe("suspended");
  await setHidden(false);
  await expect.poll(ctxState).toBe("running");

  // Original code: run cue, rejection + alarm, ECHO voice, terminal line.
  let t = Date.now();
  await runAndWait(page);
  await expect.poll(() => events(page, t)).toEqual(expect.arrayContaining(["run", "scan_reject", "alarm", "terminal_line", "echo_voice"]));

  // 6.7: scanner pass, OMNI siren, gate open, star.
  await replaceEditableCode(page, SOLUTION_67);
  await expect.poll(() => events(page)).toContain("key_blip");
  t = Date.now();
  await runAndWait(page);
  await expect.poll(() => events(page, t), { timeout: 15_000 }).toEqual(expect.arrayContaining(["run", "scan_pass", "siren", "gate_open", "star"]));
  await page.getByRole("button", { name: "Tối ưu tiếp" }).click();

  // Mute: no cue at all afterwards.
  await page.getByRole("button", { name: /TẮT TIẾNG/ }).click();
  await expect(page.getByRole("button", { name: /BẬT TIẾNG/ })).toHaveAttribute("aria-pressed", "true");
  t = Date.now();
  await runAndWait(page);
  await page.waitForTimeout(500);
  expect((await events(page, t)).filter((e) => CUES.has(e))).toEqual([]);

  // Mute survives a reload: still silent after a new gesture and a run.
  await page.reload();
  await waitForPythonReady(page);
  await firstGesture(page);
  await page.keyboard.press("Escape");
  if (await page.getByRole("button", { name: "Mã", exact: true }).isVisible()) await page.getByRole("button", { name: "Mã", exact: true }).click();
  await expect(page.getByRole("button", { name: /BẬT TIẾNG/ })).toHaveAttribute("aria-pressed", "true");
  t = Date.now();
  await runAndWait(page);
  await page.waitForTimeout(500);
  expect((await events(page, t)).filter((e) => CUES.has(e))).toEqual([]);
  if (await page.locator("dialog[open]").count()) await page.getByRole("button", { name: "Tối ưu tiếp" }).click();
  // Unmute again for hygiene of the persisted setting.
  await page.getByRole("button", { name: /BẬT TIẾNG/ }).click();
});
