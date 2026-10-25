import type { RunnerStatus, RunnerStatusDetail } from "../engine/py-runner";
import type { LevelProgress, StarCount } from "../storage/progress-repository";
import { defaultLevelProgress } from "../storage/progress-repository";
import type { RunOutcome } from "./classify-run";
import type { EchoLine } from "./echo-reactions";
import type { ReactionKey } from "./level-types";
import type { TerminalLine } from "./terminal-lines";

export type GamePhase = "booting" | "ready" | "running" | "animating" | "fatal";

export interface FatalInfo {
  kind: "level" | "unsupported" | "crash";
  message: string;
}

export interface EchoState extends EchoLine {
  /** Bumps on every new line so the portrait glitches and the text re-types. */
  id: number;
}

export interface GameState {
  phase: GamePhase;
  runnerStatus: RunnerStatus;
  runnerDetail: RunnerStatusDetail;
  fatal: FatalInfo | null;
  progress: LevelProgress;
  progressLoaded: boolean;
  outcome: RunOutcome | null;
  /** Outcome waiting for its animation to finish before terminal/ECHO update. */
  pending: { outcome: RunOutcome; echo: EchoLine; terminal: TerminalLine[] } | null;
  history: ReactionKey[];
  echo: EchoState;
  terminal: TerminalLine[];
  lastRunStars: StarCount | null;
  dialogOpen: boolean;
  notice: string | null;
}

export type GameAction =
  | { type: "runner_status"; status: RunnerStatus; detail: RunnerStatusDetail }
  | { type: "progress_loaded"; progress: LevelProgress; notice?: string }
  | { type: "progress_saved"; progress: LevelProgress }
  | { type: "run_started" }
  | { type: "run_aborted" }
  | { type: "run_finished"; outcome: RunOutcome; echo: EchoLine; terminal: TerminalLine[] }
  | { type: "animation_done" }
  | { type: "echo_say"; line: EchoLine }
  | { type: "hint_opened"; level: StarCount; text: string }
  | { type: "close_dialog" }
  | { type: "terminal_note"; line: TerminalLine }
  | { type: "fatal"; fatal: FatalInfo };

const MAX_TERMINAL_LINES = 120;

export function initialGameState(entry: string): GameState {
  return {
    phase: "booting",
    runnerStatus: "idle",
    runnerDetail: {},
    fatal: null,
    progress: defaultLevelProgress(),
    progressLoaded: false,
    outcome: null,
    pending: null,
    history: [],
    echo: { primary: entry, id: 1 },
    terminal: [{ id: 1, tone: "muted", text: "> Kết nối laptop offline… chờ lõi Python." }],
    lastRunStars: null,
    dialogOpen: false,
    notice: null,
  };
}

/** The single gate for starting a run (button, shortcut, double-click). */
export const canRun = (s: GameState) =>
  s.phase === "ready" && s.runnerStatus === "ready" && s.progressLoaded && !s.dialogOpen;

/** Append with increasing ids so the UI can key lines stably (screen readers announce only additions). */
function appendTerminal(old: TerminalLine[], lines: TerminalLine[]): TerminalLine[] {
  let id = old.at(-1)?.id ?? 0;
  return [...old, ...lines.map((l) => ({ ...l, id: ++id }))].slice(-MAX_TERMINAL_LINES);
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  if (state.phase === "fatal" && action.type !== "fatal") return state;
  switch (action.type) {
    case "runner_status": {
      const next = { ...state, runnerStatus: action.status, runnerDetail: action.detail };
      if (state.phase === "booting" && action.status === "ready") {
        next.phase = "ready";
        next.terminal = appendTerminal(state.terminal, [
          {
            tone: "ok",
            text: `> LÕI PYTHON${action.detail.pythonVersion ? " " + action.detail.pythonVersion : ""} SẴN SÀNG. Ctrl/⌘ + Enter để chạy.`,
          },
        ]);
      }
      return next;
    }
    case "progress_loaded":
      return {
        ...state,
        progress: action.progress,
        progressLoaded: true,
        notice: action.notice ?? null,
        terminal: action.notice ? appendTerminal(state.terminal, [{ tone: "alarm", text: `> ${action.notice}` }]) : state.terminal,
      };
    case "progress_saved":
      return { ...state, progress: action.progress };
    case "run_started":
      if (!canRun(state)) return state;
      return {
        ...state,
        phase: "running",
        progress: { ...state.progress, runs: state.progress.runs + 1 },
        dialogOpen: false,
      };
    case "run_aborted":
      return state.phase === "running" ? { ...state, phase: "ready" } : state;
    case "run_finished":
      if (state.phase !== "running") return state;
      return {
        ...state,
        phase: "animating",
        outcome: action.outcome,
        pending: { outcome: action.outcome, echo: action.echo, terminal: action.terminal },
        lastRunStars: action.outcome.stars,
      };
    case "animation_done": {
      if (state.phase !== "animating" || !state.pending) return state;
      const { outcome, echo, terminal } = state.pending;
      return {
        ...state,
        phase: "ready",
        pending: null,
        history: [...state.history, outcome.key],
        echo: { ...echo, id: state.echo.id + 1 },
        terminal: appendTerminal(state.terminal, terminal),
        dialogOpen: outcome.stars >= 1,
        progress: { ...state.progress, bestStars: Math.max(state.progress.bestStars, outcome.stars) as StarCount },
      };
    }
    case "echo_say":
      return { ...state, echo: { ...action.line, id: state.echo.id + 1 } };
    case "hint_opened":
      if (action.level !== state.progress.hintsOpened + 1) return state;
      return {
        ...state,
        progress: { ...state.progress, hintsOpened: action.level },
        echo: { primary: action.text, id: state.echo.id + 1 },
      };
    case "close_dialog":
      return { ...state, dialogOpen: false };
    case "terminal_note":
      return { ...state, terminal: appendTerminal(state.terminal, [action.line]) };
    case "fatal":
      return { ...state, phase: "fatal", fatal: action.fatal };
  }
}
