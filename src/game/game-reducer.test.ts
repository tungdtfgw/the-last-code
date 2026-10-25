import { describe, expect, test } from "vitest";
import type { RunOutcome } from "./classify-run";
import { canRun, gameReducer, initialGameState, type GameAction, type GameState } from "./game-reducer";
import { defaultLevelProgress } from "../storage/progress-repository";

const reduce = (s: GameState, ...actions: GameAction[]) => actions.reduce(gameReducer, s);
const outcome = (stars: 0 | 1 | 2 | 3, key = "type_mismatch") => ({ key, stars }) as unknown as RunOutcome;
const ready = () =>
  reduce(
    initialGameState("entry"),
    { type: "progress_loaded", progress: defaultLevelProgress() },
    { type: "runner_status", status: "ready", detail: { pythonVersion: "3.14.2" } },
  );

describe("game reducer", () => {
  test("RUN is ignored while booting and does not count a run (C1)", () => {
    const s = reduce(initialGameState("e"), { type: "progress_loaded", progress: defaultLevelProgress() });
    expect(canRun(s)).toBe(false);
    const after = gameReducer(s, { type: "run_started" });
    expect(after).toBe(s);
    expect(after.progress.runs).toBe(0);
  });

  test("RUN is ignored while running or animating (C2 double click)", () => {
    let s = gameReducer(ready(), { type: "run_started" });
    expect(s.phase).toBe("running");
    expect(s.progress.runs).toBe(1);
    expect(gameReducer(s, { type: "run_started" })).toBe(s);
    s = gameReducer(s, { type: "run_finished", outcome: outcome(0), echo: { primary: "x" }, terminal: [] });
    expect(s.phase).toBe("animating");
    expect(gameReducer(s, { type: "run_started" })).toBe(s);
    expect(s.progress.runs).toBe(1);
  });

  test("RUN is ignored while the runner restarts after a timeout", () => {
    const s = reduce(ready(), { type: "runner_status", status: "restarting", detail: {} });
    expect(canRun(s)).toBe(false);
  });

  test("running → animating → ready; terminal and ECHO update only after the animation", () => {
    let s = reduce(ready(), { type: "run_started" }, {
      type: "run_finished",
      outcome: outcome(2, "counter_ValueError"),
      echo: { primary: "ECHO" },
      terminal: [{ tone: "trace", text: "> TRUY VẾT" }],
    });
    expect(s.echo.primary).toBe("entry");
    expect(s.terminal.at(-1)?.text).not.toBe("> TRUY VẾT");
    expect(s.progress.bestStars).toBe(0); // revealed only after the animation
    s = gameReducer(s, { type: "animation_done" });
    expect(s.progress.bestStars).toBe(2);
    expect(s.phase).toBe("ready");
    expect(s.echo.primary).toBe("ECHO");
    expect(s.terminal.at(-1)?.text).toBe("> TRUY VẾT");
    expect(s.history).toEqual(["counter_ValueError"]);
    expect(s.dialogOpen).toBe(true);
    expect(canRun(s)).toBe(false);
    s = gameReducer(s, { type: "close_dialog" });
    expect(canRun(s)).toBe(true);
  });

  test("history collects keys for repeated_fail; no dialog on 0 stars", () => {
    let s = ready();
    for (let i = 0; i < 3; i++) {
      s = reduce(s, { type: "run_started" }, { type: "run_finished", outcome: outcome(0, "TypeError"), echo: { primary: "x" }, terminal: [] }, { type: "animation_done" });
    }
    expect(s.history).toEqual(["TypeError", "TypeError", "TypeError"]);
    expect(s.dialogOpen).toBe(false);
    expect(s.progress.runs).toBe(3);
  });

  test("best stars never drop", () => {
    let s = reduce(ready(), { type: "run_started" }, { type: "run_finished", outcome: outcome(3, "three_stars"), echo: { primary: "" }, terminal: [] }, { type: "animation_done" }, { type: "close_dialog" });
    s = reduce(s, { type: "run_started" }, { type: "run_finished", outcome: outcome(0), echo: { primary: "" }, terminal: [] });
    expect(s.progress.bestStars).toBe(3);
    expect(s.lastRunStars).toBe(0);
  });

  test("hints open strictly in order", () => {
    let s = ready();
    expect(gameReducer(s, { type: "hint_opened", level: 2, text: "b" })).toBe(s);
    s = gameReducer(s, { type: "hint_opened", level: 1, text: "a" });
    expect(s.progress.hintsOpened).toBe(1);
    expect(s.echo.primary).toBe("a");
  });

  test("run aborted (runner not ready) returns to ready", () => {
    const s = reduce(ready(), { type: "run_started" }, { type: "run_aborted" });
    expect(s.phase).toBe("ready");
  });

  test("fatal is terminal", () => {
    const s = reduce(ready(), { type: "fatal", fatal: { kind: "level", message: "x" } });
    expect(gameReducer(s, { type: "run_started" })).toBe(s);
    expect(s.phase).toBe("fatal");
  });

  test("terminal keeps a bounded history", () => {
    let s = ready();
    for (let i = 0; i < 300; i++) s = gameReducer(s, { type: "terminal_note", line: { tone: "info", text: String(i) } });
    expect(s.terminal.length).toBeLessThanOrEqual(120);
    expect(s.terminal.at(-1)?.text).toBe("299");
    const ids = s.terminal.map((l) => l.id!);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.at(-1)).toBeGreaterThan(ids[0]);
  });
});
