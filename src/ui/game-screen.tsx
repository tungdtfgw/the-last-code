import { useCallback, useEffect, useRef, useState } from "react";
import type { AudioControls } from "../audio/use-audio";
import { canRun } from "../game/game-reducer";
import type { LevelDefinition } from "../game/level-types";
import { useGame } from "../game/use-game";
import type { ProgressRepository } from "../storage/progress-repository";
import { BootScreen } from "./boot-screen";
import { foldBriefing, rememberFold, sessionFold, type BriefingFoldEvent } from "./briefing-collapse";
import { BriefingPanel } from "./briefing-panel";
import { CodeEditor, type CodeEditorHandle } from "./code-editor";
import { EchoChat } from "./echo-chat";
import { FatalScreen } from "./fatal-screen";
import { IntroGate } from "./intro-gate";
import { ObjectivesPanel } from "./objectives-panel";
import { ResultsDialog } from "./results-dialog";
import { RunControls } from "./run-controls";
import { LevelSimulation, SimulationLegend } from "./level-simulation";
import { StarRow } from "./star-icon";
import { TerminalPanel } from "./terminal-panel";
import { useReducedMotion } from "./use-reduced-motion";
import { vocabularyFor } from "../game/sim-vocabulary";

type Tab = "mission" | "code" | "sim";
const TABS: { id: Tab; label: string }[] = [
  { id: "mission", label: "Nhiệm vụ" },
  { id: "code", label: "Mã" },
  { id: "sim", label: "Mô phỏng" },
];

/** Level start: entry gate, then the briefing types out, then objectives lock in one by one. */
type Intro = "gate" | "briefing" | "objectives" | "done";
const OBJECTIVE_STEP_MS = 420;

export interface GameScreenProps {
  level: LevelDefinition;
  repository: ProgressRepository;
  /** Owned by the app so one AudioContext lives across every screen. */
  audio: AudioControls;
  /** Entry gate ignores clicks this long (set after a story, so a held Enter does not start the mission). */
  entryGuardMs?: number;
  onMap(): void;
  /** Results dialog TIẾP TỤC. */
  onContinue(): void;
}

export function GameScreen({ level, repository, audio, entryGuardMs = 0, onMap, onContinue }: GameScreenProps) {
  const game = useGame(level, repository, audio);
  const { state } = game;
  const editor = useRef<CodeEditorHandle>(null);
  const runButton = useRef<HTMLButtonElement>(null);
  // Phones open on the mission tab so the intro reveal is visible.
  const [tab, setTab] = useState<Tab>("mission");
  const reduced = useReducedMotion();
  const [intro, setIntro] = useState<Intro>("gate");
  const [revealed, setRevealed] = useState(0);
  const introDone = intro === "done";
  const autoSwitched = useRef(false);
  const refocusRun = useRef(false);
  const runnable = canRun(state);

  // The briefing folds once after the first finished run (kept per level for this page session).
  const [fold, setFold] = useState(() => sessionFold(level.id));
  const changeFold = useCallback(
    (event: BriefingFoldEvent) =>
      setFold((f) => {
        const next = foldBriefing(f, event);
        rememberFold(level.id, next);
        return next;
      }),
    [level.id],
  );
  const wasRunning = useRef(false);
  useEffect(() => {
    if (state.phase === "running" || state.phase === "animating") wasRunning.current = true;
    else if (state.phase === "ready" && wasRunning.current) {
      wasRunning.current = false;
      changeFold("run_done");
    }
  }, [state.phase, changeFold]);

  // Keyboard: Ctrl/⌘+Enter runs from anywhere (M for sound is handled by the app).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        if (e.defaultPrevented || document.querySelector("dialog[open]")) return;
        e.preventDefault();
        if (!e.repeat) void game.run();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [game]);

  const { play, unlock } = audio;
  const enterMission = useCallback(() => {
    // The click is the first gesture. Audio already started unlocking on pointerdown,
    // so the reveal can begin right away and stays skippable from the first moment.
    void unlock();
    setIntro(reduced ? "done" : "briefing");
  }, [unlock, reduced]);

  // Objectives lock in one by one, then the alert meter powers up.
  useEffect(() => {
    if (intro !== "objectives") return;
    const total = level.objectives.length;
    const timers = Array.from({ length: total + 1 }, (_, i) =>
      setTimeout(() => {
        if (i < total) {
          setRevealed(i + 1);
          play("objective_lock");
        } else {
          play("terminal_line");
          setIntro("done");
        }
      }, (i + 1) * OBJECTIVE_STEP_MS),
    );
    return () => timers.forEach(clearTimeout);
  }, [intro, level.objectives.length, play]);

  // Any click or key during the reveal shows everything at once (switching phone tabs does not).
  useEffect(() => {
    if (intro !== "briefing" && intro !== "objectives") return;
    const skip = (e: Event) => {
      if (e.target instanceof Element && e.target.closest(".tabs")) return;
      setIntro("done");
    };
    window.addEventListener("pointerdown", skip, true);
    window.addEventListener("keydown", skip, true);
    return () => {
      window.removeEventListener("pointerdown", skip, true);
      window.removeEventListener("keydown", skip, true);
    };
  }, [intro]);

  // The briefing and objectives follow the reveal down their boxes; once it ends, every
  // mission panel starts from its top so the first paragraph and objective are in view.
  const missionCol = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!introDone) return;
    missionCol.current?.querySelectorAll<HTMLElement>(":scope > .panel").forEach((p) => (p.scrollTop = 0));
  }, [introDone]);

  // Mobile: follow the run on the simulation tab, then come back to the code.
  useEffect(() => {
    if (state.phase === "running" && tab !== "sim") {
      autoSwitched.current = true;
      // Hiding the code tab drops keyboard focus to <body>; remember to bring it back.
      refocusRun.current = document.activeElement === runButton.current;
      setTab("sim");
    } else if (state.phase === "ready" && autoSwitched.current && !state.dialogOpen) {
      autoSwitched.current = false;
      setTab("code");
    }
  }, [state.phase, state.dialogOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Runs after the code tab is committed (visible), so the run button can take focus again.
  useEffect(() => {
    if (tab !== "code" || !refocusRun.current) return;
    refocusRun.current = false;
    // After the closing dialog has restored its own focus.
    requestAnimationFrame(() => runButton.current?.focus());
  }, [tab]);

  // Mobile: the load error and its retry button live on the simulation tab.
  useEffect(() => {
    if (state.runnerStatus === "failed") setTab("sim");
  }, [state.runnerStatus]);

  const closeDialog = useCallback(() => {
    game.closeDialog();
    // Phone layout: come back to the code tab first, otherwise the run button is hidden and cannot take focus.
    if (autoSwitched.current) {
      autoSwitched.current = false;
      refocusRun.current = true;
      setTab("code");
    } else {
      setTimeout(() => runButton.current?.focus(), 0);
    }
  }, [game]);

  if (state.runnerStatus === "failed" && state.runnerDetail.reason === "unsupported") {
    return (
      <FatalScreen
        title="TRÌNH DUYỆT KHÔNG HỖ TRỢ"
        message="Lõi Python cần tiến trình nền dạng module (module Web Worker)."
        detail={["Chrome hoặc Edge 80+", "Firefox 114+", "Safari 15+"]}
      />
    );
  }

  const booting = state.runnerStatus !== "ready" && state.runnerStatus !== "running";
  const showBoot = booting && (state.phase === "booting" || state.runnerStatus === "failed" || state.runnerStatus === "restarting");
  const lastStdout = state.phase === "ready" && state.outcome ? state.outcome.stdout : null;

  return (
    <div className="game" data-tab={tab}>
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true" />
          <div>
            <p className="brand-name">MÃ CUỐI CÙNG</p>
            <h1 className="level-title">
              <span className="level-id">{level.id}</span> {level.title}
            </h1>
          </div>
        </div>
        <button type="button" className="btn btn-ghost btn-small topbar-map" onClick={onMap}>
          BẢN ĐỒ
        </button>
        <dl className="topbar-stats">
          <div>
            <dt>Lượt chạy</dt>
            <dd data-testid="run-count">{state.progress.runs}</dd>
          </div>
          <div>
            <dt>Cao nhất</dt>
            <dd>
              <StarRow count={state.progress.bestStars} size={14} />
            </dd>
          </div>
        </dl>
        {!game.persistent && (
          <p className="storage-flag" role="status" title="Trình duyệt chặn bộ nhớ: tiến độ chỉ giữ trong phiên này.">
            CHẾ ĐỘ KHÔNG LƯU
          </p>
        )}
      </header>

      <nav className="tabs" aria-label="Khu vực">
        {TABS.map((t) => (
          <button key={t.id} type="button" className="tab" aria-pressed={tab === t.id} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </nav>

      <div ref={missionCol} className="col col-mission" data-area="mission">
        <BriefingPanel
          level={level}
          mode={intro === "gate" ? "hidden" : intro === "briefing" ? "typing" : "full"}
          onCue={audio.play}
          onTyped={() => setIntro((i) => (i === "briefing" ? "objectives" : i))}
          // Always open during the intro so the briefing can type out.
          collapsed={introDone && fold.collapsed}
          onToggle={() => changeFold("toggle")}
        />
        <ObjectivesPanel
          level={level}
          outcome={state.phase === "ready" ? state.outcome : null}
          revealed={introDone ? level.objectives.length : revealed}
          meterShown={introDone}
        />
      </div>

      <div className="col col-code" data-area="code">
        <section className="panel editor-panel" aria-labelledby="editor-title">
          <header className="panel-head">
            <h2 id="editor-title" className="panel-title">neural_id.py</h2>
            <span className="panel-meta">dòng khóa = dữ liệu nạp sẵn · Esc rồi Tab để rời</span>
          </header>
          <div className="editor-wrap">
            {game.initialDoc ? (
              <CodeEditor
                ref={editor}
                initialCode={game.initialDoc.code}
                lockStart={game.initialDoc.lockStart}
                lockedTexts={game.lockedTexts}
                onChange={game.onCodeChange}
                onRun={() => void game.run()}
                onCue={audio.play}
              />
            ) : (
              <p className="panel-note">Đang đọc bản nháp…</p>
            )}
          </div>
          <RunControls
            ref={runButton}
            state={state}
            canRun={runnable}
            editorReady={game.initialDoc !== null}
            muted={audio.muted}
            firstRun={state.progress.runs === 0}
            onRun={() => void game.run()}
            onReset={() => {
              if (editor.current?.reset(level.starter_code, level.locked_lines[0] ?? 1)) game.noteReset();
            }}
            onToggleMute={audio.toggleMute}
          />
        </section>
        <TerminalPanel
          lines={state.terminal}
          stdout={lastStdout}
          stdoutTruncated={state.outcome?.stdoutTruncated ?? false}
          stderr={state.phase === "ready" && state.outcome ? state.outcome.stderr : null}
          note={vocabularyFor(level).terminalNote}
          onJump={(line) => {
            setTab("code");
            editor.current?.focusLine(line);
          }}
        />
      </div>

      <div className="col col-sim" data-area="sim">
        <section className="panel sim-panel" aria-labelledby="sim-title">
          <header className="panel-head">
            <h2 id="sim-title" className="panel-title">{level.location ?? level.title}</h2>
            <span className="panel-meta">
              <SimulationLegend level={level} />
            </span>
          </header>
          <div className="sim-wrap">
            <LevelSimulation
              level={level}
              outcome={state.outcome}
              running={state.phase === "running"}
              playing={state.phase === "animating"}
              onDone={game.animationDone}
              onCue={audio.play}
            />
            {showBoot && <BootScreen status={state.runnerStatus} detail={state.runnerDetail} onRetry={game.retryRunner} />}
          </div>
        </section>
      </div>

      <EchoChat
        chat={state.chat}
        awake={introDone}
        levelId={level.id}
        taskSteps={level.task_steps}
        hints={level.hints}
        hintsOpened={state.progress.hintsOpened}
        onOpenHint={game.openHint}
        onCue={audio.play}
      />

      {intro === "gate" && <IntroGate level={level} onEnter={enterMission} guardMs={entryGuardMs} />}

      <ResultsDialog open={state.dialogOpen} outcome={state.outcome} echo={state.echo} progress={state.progress} level={level} onClose={closeDialog} onContinue={onContinue} />
    </div>
  );
}
