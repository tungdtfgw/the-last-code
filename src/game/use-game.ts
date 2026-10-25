import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import type { AudioControls } from "../audio/use-audio";
import { PyRunner } from "../engine/py-runner";
import { MAX_DRAFT_CHARS, defaultLevelProgress, type ProgressRepository, type StarCount } from "../storage/progress-repository";
import { findLockedBlock } from "../ui/locked-lines-extension";
import { buildConfig } from "./build-config";
import { classifyRun } from "./classify-run";
import { selectEntry, selectReaction } from "./echo-reactions";
import { canRun, gameReducer, initialGameState } from "./game-reducer";
import type { LevelDefinition } from "./level-types";
import { prepareSource } from "./prepare-source";
import { buildTerminalLines } from "./terminal-lines";

export interface InitialDoc {
  code: string;
  /** 1-based first line of the locked block in `code`. */
  lockStart: number;
}

const DRAFT_DEBOUNCE_MS = 500;

export function lockedTextsOf(level: LevelDefinition): string[] {
  const lines = level.starter_code.replace(/\r\n?/g, "\n").split("\n");
  return level.locked_lines.map((n) => lines[n - 1] ?? "");
}

/** Wires the Python runner, grading, ECHO and the progress repository into one game loop. */
export function useGame(level: LevelDefinition, repository: ProgressRepository, audio: AudioControls) {
  const [state, dispatch] = useReducer(gameReducer, level, (l) => initialGameState(selectEntry(l)));
  const stateRef = useRef(state);
  stateRef.current = state;
  const [initialDoc, setInitialDoc] = useState<InitialDoc | null>(null);
  const [persistent, setPersistent] = useState(repository.persistent);
  const runnerRef = useRef<PyRunner | null>(null);
  const busyRef = useRef(false);
  const codeRef = useRef(level.starter_code);
  const lockedRef = useRef<number[]>(level.locked_lines);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirty = useRef(false);
  const oversizeWarned = useRef(false);
  const configJson = useMemo(() => buildConfig(level), [level]);
  const lockedTexts = useMemo(() => lockedTextsOf(level), [level]);

  // Progress: restore the draft only if its locked block is intact.
  useEffect(() => {
    let alive = true;
    void repository
      .getLevel(level.id)
      .catch(() => defaultLevelProgress())
      .then((progress) => {
      if (!alive) return;
      let code = level.starter_code;
      let lockStart = level.locked_lines[0] ?? 1;
      let notice: string | undefined;
      if (progress.draft !== null) {
        const found = findLockedBlock(progress.draft, lockedTexts);
        if (found !== null) {
          code = progress.draft;
          lockStart = found;
        } else {
          notice = "BẢN NHÁP HỎNG, ĐÃ KHÔI PHỤC MÃ GỐC";
          void repository.updateLevel(level.id, { draft: null });
        }
      }
      codeRef.current = code;
      lockedRef.current = lockedTexts.map((_t, i) => lockStart + i);
      setInitialDoc({ code, lockStart });
      dispatch({ type: "progress_loaded", progress, notice, hints: level.hints });
    });
    return () => {
      alive = false;
    };
  }, [level, repository, lockedTexts]);

  useEffect(
    () =>
      repository.onPersistenceLost(() => {
        setPersistent(false);
        dispatch({ type: "terminal_note", line: { tone: "alarm", text: "> KHÔNG LƯU ĐƯỢC TIẾN ĐỘ: bộ nhớ trình duyệt bị chặn hoặc đã đầy" } });
      }),
    [repository],
  );

  // Python runner lifecycle.
  useEffect(() => {
    const runner = new PyRunner();
    runnerRef.current = runner;
    const off = runner.onStatus((status, detail) => dispatch({ type: "runner_status", status, detail }));
    void runner.init();
    return () => {
      off();
      runner.dispose();
      if (runnerRef.current === runner) runnerRef.current = null;
    };
  }, []);

  // Draft saving: debounced, plus a flush when the page is hidden or closed.
  const flushDraft = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = null;
    if (!dirty.current) return;
    dirty.current = false;
    void repository.updateLevel(level.id, { draft: codeRef.current });
  }, [level.id, repository]);

  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden") flushDraft();
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", flushDraft);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", flushDraft);
      flushDraft();
    };
  }, [flushDraft]);

  const onCodeChange = useCallback(
    (code: string, lockedLineNumbers: number[]) => {
      codeRef.current = code;
      lockedRef.current = lockedLineNumbers;
      dirty.current = true;
      if (code.length > MAX_DRAFT_CHARS && !oversizeWarned.current) {
        oversizeWarned.current = true;
        dispatch({ type: "terminal_note", line: { tone: "alarm", text: `> BẢN NHÁP QUÁ DÀI (> ${MAX_DRAFT_CHARS} ký tự): sẽ không được lưu.` } });
      } else if (code.length <= MAX_DRAFT_CHARS) {
        oversizeWarned.current = false;
      }
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(flushDraft, DRAFT_DEBOUNCE_MS);
    },
    [flushDraft],
  );

  const run = useCallback(async () => {
    const runner = runnerRef.current;
    if (busyRef.current || !runner || !canRun(stateRef.current)) return;
    busyRef.current = true;
    try {
      const runNumber = stateRef.current.progress.runs + 1;
      dispatch({ type: "run_started" });
      audio.play("run");
      dirty.current = false;
      void repository.updateLevel(level.id, { runs: runNumber, draft: codeRef.current });
      const result = await runner.run(configJson, prepareSource(codeRef.current, lockedRef.current));
      if (result.kind === "not_ready") {
        dispatch({ type: "run_aborted" });
        return;
      }
      const outcome = classifyRun(result, level);
      const echo = selectReaction(outcome, level, stateRef.current.history);
      const terminal = buildTerminalLines(outcome, level, runNumber);
      dispatch({ type: "run_finished", outcome, echo, terminal });
      void repository.updateLevel(level.id, { bestStars: outcome.stars });
    } catch (err) {
      console.error("[run]", err);
      dispatch({ type: "run_aborted" });
      dispatch({ type: "terminal_note", line: { tone: "alarm", text: "> LỖI NỘI BỘ KHI CHẤM KẾT QUẢ. Lượt này không được tính sao." } });
    } finally {
      busyRef.current = false;
    }
  }, [audio, configJson, level, repository]);

  const animationDone = useCallback(() => {
    if (stateRef.current.phase !== "animating") return;
    dispatch({ type: "animation_done" });
    audio.play("terminal_line");
  }, [audio]);

  const openHint = useCallback(
    (n: StarCount) => {
      const text = level.hints[n - 1];
      if (!text || n !== stateRef.current.progress.hintsOpened + 1) return;
      dispatch({ type: "hint_opened", level: n, text });
      void repository.updateLevel(level.id, { hintsOpened: n });
    },
    [level, repository],
  );

  const closeDialog = useCallback(() => dispatch({ type: "close_dialog" }), []);
  const retryRunner = useCallback(() => void runnerRef.current?.retry(), []);
  const noteReset = useCallback(() => {
    dispatch({ type: "terminal_note", line: { tone: "muted", text: "> Đã khôi phục mã gốc." } });
  }, []);

  return {
    state,
    initialDoc,
    persistent,
    lockedTexts,
    run,
    onCodeChange,
    animationDone,
    openHint,
    closeDialog,
    retryRunner,
    noteReset,
  };
}

export type GameApi = ReturnType<typeof useGame>;
