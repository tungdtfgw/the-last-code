import { useCallback, useEffect, useId, useLayoutEffect, useReducer, useRef, useState } from "react";
import type { Cue } from "../audio/sound-recipes";
import { bubbleVisible, chatUiReducer, initialChatUi, isUnread, stepsSeen } from "../game/echo-chat";
import type { ChatMessage } from "../game/game-reducer";
import type { StarCount } from "../storage/progress-repository";
import { EchoPortrait } from "./echo-face";
import { HintsPanel } from "./hints-panel";
import { isTyping } from "./is-typing";
import { TaskStepsCard } from "./task-steps-panel";
import { useReducedMotion } from "./use-reduced-motion";
import { useTypewriter } from "./use-typewriter";

const TYPE_MS = 22;

interface Props {
  chat: readonly ChatMessage[];
  /** ECHO stays silent until the level intro has finished. */
  awake: boolean;
  levelId: string;
  /** "Việc cần làm", pinned above the history when the level has it. */
  taskSteps?: string[];
  hints: readonly string[];
  hintsOpened: number;
  onOpenHint(n: StarCount): void;
  onCue(cue: Cue): void;
}

const fullText = (m: ChatMessage) => (m.followUp ? `${m.primary}\n${m.followUp}` : m.primary);

function label(m: ChatMessage) {
  if (m.tag === "run") return `Lượt chạy #${m.run}`;
  if (m.tag === "hint") return `Gợi ý mức ${m.hint}`;
  return "Vào nhiệm vụ";
}

/**
 * ECHO as a floating chat: a portrait button, a preview bubble for each new line, and a
 * non-blocking chat panel with the level's conversation and the hint log. The editor and
 * the run button stay usable while it is open.
 */
export function EchoChat({ chat, awake, levelId, taskSteps, hints, hintsOpened, onOpenHint, onCue }: Props) {
  const reduced = useReducedMotion();
  const [ui, dispatch] = useReducer(chatUiReducer, initialChatUi);
  const last = chat.at(-1) ?? null;
  const firstEntryId = chat.find((m) => m.tag === "entry")?.id;
  const lastId = awake && last ? last.id : null;
  const unread = isUnread(ui, lastId);
  const showBubble = bubbleVisible(ui, lastId);
  const panelId = useId();
  const panel = useRef<HTMLElement>(null);
  const log = useRef<HTMLOListElement>(null);
  const fab = useRef<HTMLButtonElement>(null);
  const opener = useRef<Element | null>(null);
  // Points the player to "Việc cần làm" until the chat has been opened once for this level.
  const [stepsPending, setStepsPending] = useState(() => stepsSeen.pending(levelId, !!taskSteps?.length));
  const pointToSteps = awake && stepsPending;

  // Each new line: a bubble (or straight into the open chat), and the portrait glitches for a moment.
  const [speaking, setSpeaking] = useState(false);
  useEffect(() => {
    if (lastId === null || !last) return;
    dispatch({ type: "message", id: lastId });
    setSpeaking(true);
    const id = setTimeout(() => setSpeaking(false), Math.min(2600, 500 + fullText(last).length * TYPE_MS));
    return () => clearTimeout(id);
  }, [lastId]); // eslint-disable-line react-hooks/exhaustive-deps

  const open = useCallback(() => {
    if (lastId === null) return;
    opener.current = document.activeElement;
    dispatch({ type: "open", lastId });
    stepsSeen.markOpened(levelId);
    setStepsPending(false);
  }, [lastId, levelId]);

  const close = useCallback(() => {
    dispatch({ type: "close" });
    const back = opener.current;
    opener.current = null;
    // Back to where the player was, or to the ECHO button.
    requestAnimationFrame(() => {
      if (back instanceof HTMLElement && back.isConnected && back !== document.body) back.focus();
      else fab.current?.focus();
    });
  }, []);

  // Focus moves into the chat when it opens; the newest line is in view.
  useLayoutEffect(() => {
    if (!ui.open) return;
    if (log.current) log.current.scrollTop = log.current.scrollHeight;
  }, [ui.open, chat.length]);
  useEffect(() => {
    if (ui.open) panel.current?.focus();
  }, [ui.open]);

  // A line said while the chat is open (a decoded hint) still sounds like ECHO.
  const prevLast = useRef(lastId);
  useEffect(() => {
    if (ui.open && lastId !== null && prevLast.current !== null && lastId !== prevLast.current) onCue("echo_voice");
    prevLast.current = lastId;
  }, [lastId, ui.open, onCue]);

  // E opens the chat (outside text entry), Esc closes it (unless the editor or a dialog owns Esc).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey || document.querySelector("dialog[open]")) return;
      if ((e.key === "e" || e.key === "E") && !e.repeat && !isTyping(e.target) && lastId !== null) {
        e.preventDefault();
        if (ui.open) panel.current?.focus();
        else open();
      } else if (e.key === "Escape" && ui.open) {
        const inChat = e.target instanceof Node && panel.current?.contains(e.target);
        if (inChat || !isTyping(e.target)) {
          e.preventDefault();
          close();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [ui.open, lastId, open, close]);

  return (
    <div className={`echo-dock${ui.open ? " is-open" : ""}`}>
      <p className="sr-only echo-live" aria-live="polite">
        {lastId !== null && last ? `ECHO: ${fullText(last)}` : ""}
      </p>

      {showBubble && last && (
        <EchoBubble key={last.id} message={last} reduced={reduced} pointToSteps={pointToSteps} onCue={onCue} onOpen={open} onDismiss={() => dispatch({ type: "dismiss" })} />
      )}

      <section
        ref={panel}
        id={panelId}
        className="echo-chat"
        role="dialog"
        aria-modal="false"
        aria-labelledby={`${panelId}-title`}
        tabIndex={-1}
        hidden={!ui.open}
      >
        <header className="echo-chat-head">
          <EchoPortrait speaking={speaking && !reduced} />
          <div className="echo-chat-name">
            <h2 id={`${panelId}-title`} className="panel-title">ECHO</h2>
            <span className="panel-meta">trợ lý cũ · chỉ đọc</span>
          </div>
          <button type="button" className="btn btn-ghost btn-icon echo-chat-close" aria-label="Đóng khung chat ECHO" onClick={close}>
            <span aria-hidden="true">×</span>
          </button>
        </header>
        <ol ref={log} className="echo-log" aria-label="Lịch sử hội thoại">
          {ui.open &&
            chat.map((m) => (
              <li key={m.id} className={`echo-msg is-${m.tag}`}>
                <span className="echo-msg-tag">{label(m)}</span>
                <p className="echo-msg-text">{m.primary}</p>
                {m.followUp && <p className="echo-msg-text echo-follow">{m.followUp}</p>}
                {/* "Việc cần làm" continues ECHO's opening message as one chat turn. */}
                {m.id === firstEntryId && taskSteps && taskSteps.length > 0 && (
                  <TaskStepsCard steps={taskSteps} titleId={`${panelId}-steps`} />
                )}
              </li>
            ))}
        </ol>
        <HintsPanel hints={hints} opened={hintsOpened} onOpen={onOpenHint} />
      </section>

      <button
        ref={fab}
        type="button"
        className={`echo-fab${unread ? " has-unread" : ""}${pointToSteps ? " points-steps" : ""}`}
        aria-expanded={ui.open}
        aria-controls={panelId}
        aria-label={`ECHO${unread ? ", có tin mới" : ""}${pointToSteps ? ", có việc cần làm" : ""}. ${ui.open ? "Đóng" : "Mở"} khung chat (phím E)`}
        disabled={lastId === null}
        onClick={ui.open ? close : open}
      >
        <EchoPortrait speaking={speaking && !reduced && !ui.open} asleep={!awake} />
        <span className="echo-fab-label" aria-hidden="true">
          <span className="echo-fab-name">ECHO</span>
          <span className="echo-fab-meta">{!awake ? "đang ngủ" : pointToSteps ? "việc cần làm" : unread ? "tin mới" : "kênh mở"}</span>
        </span>
        {unread && <span className="echo-fab-dot" aria-hidden="true" />}
      </button>
    </div>
  );
}

function EchoBubble({
  message,
  reduced,
  pointToSteps,
  onCue,
  onOpen,
  onDismiss,
}: {
  message: ChatMessage;
  reduced: boolean;
  pointToSteps: boolean;
  onCue(cue: Cue): void;
  onOpen(): void;
  onDismiss(): void;
}) {
  const full = fullText(message);
  const typed = useTypewriter(full, { key: message.id, mode: reduced ? "full" : "typing", msPerChar: TYPE_MS, onTick: () => onCue("echo_voice") });
  const [primaryShown, followShown] = typed.split("\n");
  return (
    <div className="echo-bubble">
      <button type="button" className="echo-bubble-body" aria-label={pointToSteps ? "Mở khung chat ECHO để xem việc cần làm" : "Mở khung chat ECHO"} onClick={onOpen}>
        <span className="echo-line">
          {primaryShown}
          {!reduced && typed.length < full.length && <span className="caret" />}
        </span>
        {message.followUp && followShown !== undefined && <span className="echo-line echo-follow">{followShown}</span>}
        {pointToSteps && <span className="echo-bubble-cta">Mở để xem việc cần làm (E)</span>}
      </button>
      <button type="button" className="echo-bubble-close" aria-label="Đóng bong bóng ECHO" onClick={onDismiss}>
        <span aria-hidden="true">×</span>
      </button>
    </div>
  );
}
