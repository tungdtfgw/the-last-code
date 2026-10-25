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

/** One line in the level's ECHO chat history (session only, never persisted). */
export interface ChatMessage extends EchoState {
  tag: "entry" | "run" | "hint";
  /** Run number for a reaction (`tag: "run"`). */
  run?: number;
  /** Hint level for a decoded hint (`tag: "hint"`). */
  hint?: number;
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
  /** Everything ECHO said this session, oldest first; the last entry is always `echo`. */
  chat: ChatMessage[];
  terminal: TerminalLine[];
  lastRunStars: StarCount | null;
  dialogOpen: boolean;
  notice: string | null;
}

export type GameAction =
  | { type: "runner_status"; status: RunnerStatus; detail: RunnerStatusDetail }
  /** `hints`: the level's hint texts, so hints decoded in an earlier session reappear in the chat. */
  | { type: "progress_loaded"; progress: LevelProgress; notice?: string; hints?: readonly string[] }
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
const MAX_CHAT_MESSAGES = 80;

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
    chat: [{ primary: entry, id: 1, tag: "entry" }],
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

/** ECHO says a new line: it becomes the current line and joins the chat history. */
function say(state: GameState, line: EchoLine, meta: Pick<ChatMessage, "tag" | "run" | "hint">): GameState {
  const echo: EchoState = { ...line, id: state.echo.id + 1 };
  return { ...state, echo, chat: [...state.chat, { ...echo, ...meta }].slice(-MAX_CHAT_MESSAGES) };
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
    case "progress_loaded": {
      // Hints decoded in an earlier session go before the entry line: they are older
      // context, and the entry line stays the newest (the one the bubble shows).
      const restored: ChatMessage[] = (action.hints ?? [])
        .slice(0, action.progress.hintsOpened)
        .map((text, i) => ({ primary: text, id: -(i + 1), tag: "hint", hint: i + 1 }));
      const chat = state.progressLoaded || restored.length === 0 ? state.chat : [...restored, ...state.chat];
      return {
        ...state,
        chat,
        progress: action.progress,
        progressLoaded: true,
        notice: action.notice ?? null,
        terminal: action.notice ? appendTerminal(state.terminal, [{ tone: "alarm", text: `> ${action.notice}` }]) : state.terminal,
      };
    }
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
        ...say(state, echo, { tag: "run", run: state.progress.runs }),
        phase: "ready",
        pending: null,
        history: [...state.history, outcome.key],
        terminal: appendTerminal(state.terminal, terminal),
        dialogOpen: outcome.stars >= 1,
        progress: { ...state.progress, bestStars: Math.max(state.progress.bestStars, outcome.stars) as StarCount },
      };
    }
    case "echo_say":
      return say(state, action.line, { tag: "entry" });
    case "hint_opened":
      if (action.level !== state.progress.hintsOpened + 1) return state;
      return {
        ...say(state, { primary: action.text }, { tag: "hint", hint: action.level }),
        progress: { ...state.progress, hintsOpened: action.level },
      };
    case "close_dialog":
      return { ...state, dialogOpen: false };
    case "terminal_note":
      return { ...state, terminal: appendTerminal(state.terminal, [action.line]) };
    case "fatal":
      return { ...state, phase: "fatal", fatal: action.fatal };
  }
}
