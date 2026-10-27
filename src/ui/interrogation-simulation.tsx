import { useMemo } from "react";
import type { Cue } from "../audio/sound-recipes";
import type { RunOutcome } from "../game/classify-run";
import type { LevelDefinition } from "../game/level-types";
import { joinSegments, visible, type DiffSegments } from "../game/output-diff";
import {
  buildInterrogationTimeline,
  EMPTY_CHANNEL,
  interrogationIdleScene,
  interrogationRunningScene,
  summarizeInterrogation,
  type InterrogationScene,
  type PromptMark,
  type QuestionCard,
} from "./interrogation-timeline";
import type { OutputSlot } from "./output-slots-model";
import { Segments, SlotRow } from "./output-slots";
import { useTimelinePlayback } from "./use-timeline-playback";

interface Props {
  level: LevelDefinition;
  outcome: RunOutcome | null;
  running: boolean;
  playing: boolean;
  onDone(): void;
  onCue(cue: Cue, delayMs?: number): void;
}

const CARD_STATE: Record<QuestionCard["state"], string> = { unread: "CHƯA ĐỌC", read: "ĐÃ ĐỌC", missing: "KHÔNG CÓ DÒNG" };

/** `text` with code points `[start, end)` underlined (the prompt) and `[markAt, markAt + markLen)` marked (first wrong character). */
function Marked({ text, prompt, markAt = -1, markLen = 0 }: { text: string; prompt: PromptMark; markAt?: number; markLen?: number }) {
  const chars = Array.from(text);
  const runs: { text: string; mark: boolean; prompt: boolean }[] = [];
  chars.forEach((c, i) => {
    const mark = i >= markAt && i < markAt + markLen;
    const inPrompt = i >= prompt.start && i < prompt.end;
    const last = runs.at(-1);
    if (last && last.mark === mark && last.prompt === inPrompt) last.text += c;
    else runs.push({ text: c, mark, prompt: inPrompt });
  });
  return (
    <>
      {runs.map((r, i) => {
        const body = r.prompt ? <u className="interrogation-prompt">{r.text}</u> : r.text;
        return r.mark ? <mark key={i}>{body}</mark> : <span key={i}>{body}</span>;
      })}
    </>
  );
}

const markedGot = (got: DiffSegments, prompt: PromptMark) => (
  <Marked text={joinSegments(got)} prompt={prompt} markAt={Array.from(got.before).length} markLen={Array.from(got.mark).length} />
);

/** An answer row; a row carrying a prompt underlines it in `nhận:` (or in the extra line itself). */
function AnswerRow({ slot, prompt }: { slot: OutputSlot; prompt: PromptMark | undefined }) {
  if (!prompt || (slot.state !== "dropped" && slot.state !== "extra")) return <SlotRow slot={slot} />;
  return (
    <li className={`relay-slot is-${slot.state} has-prompt`}>
      <span className="relay-slot-line">{slot.state === "extra" ? "+" : `dòng ${slot.line}`}</span>
      <span className="relay-slot-text">{slot.state === "extra" ? <Marked text={visible(slot.expected)} prompt={prompt} /> : visible(slot.expected)}</span>
      <span className="relay-slot-state">{slot.label ?? "CHỜ"}</span>
      {slot.state === "dropped" && slot.diff && (
        <span className="relay-diff">
          <span>
            cần:{"  "}
            <Segments s={slot.diff.need} />
          </span>
          <span>
            nhận: {markedGot(slot.diff.got, prompt)}
            {slot.diff.codePoint && ` · ${slot.diff.codePoint}`}
          </span>
        </span>
      )}
      <span className="interrogation-prompt-note">lời nhắc in ra cũng đi vào câu trả lời</span>
    </li>
  );
}

function Station({ scene }: { scene: InterrogationScene }) {
  const fed = scene.feeding === null ? null : scene.questions[scene.feeding];
  return (
    <div className="interrogation-stage">
      <div className="interrogation-screen">
        <p className="interrogation-caption">CÂU HỎI CỦA TRẠM</p>
        <ol className="interrogation-cards" aria-label="Các dòng trạm gửi qua kênh nhập">
          {scene.questions.length === 0 && <li className="interrogation-card is-none">(trạm không gửi dòng nào)</li>}
          {scene.questions.map((q, i) => (
            <li key={`${scene.wave}-${i}`} className={`interrogation-card is-${q.state}${scene.feeding === i ? " is-feeding" : ""}`}>
              <span className="interrogation-card-text">{q.state === "missing" ? "▯" : visible(q.text)}</span>
              <span className="interrogation-card-state">{CARD_STATE[q.state]}</span>
            </li>
          ))}
        </ol>
      </div>
      <div className={`interrogation-slot is-${scene.channel}`} aria-hidden="true">
        <span className="interrogation-slot-mouth" />
        {fed && (
          <span key={`${scene.wave}-${scene.feeding}`} className="interrogation-slot-card">
            {visible(fed.text)}
          </span>
        )}
        <span className="interrogation-slot-lamp" />
        <span className="interrogation-slot-label">{scene.channel === "empty" ? EMPTY_CHANNEL : "KÊNH NHẬP"}</span>
      </div>
      <div className={`interrogation-laptop is-${scene.laptop}`} aria-hidden="true">
        <span className="interrogation-laptop-screen">{scene.laptop === "compile_error" ? "TỪ CHỐI" : ">_"}</span>
        <span className={`interrogation-stamp is-${scene.station}`}>
          {scene.station === "open" ? "DUYỆT" : scene.station === "half" ? "DUYỆT ½" : "CHƯA DUYỆT"}
        </span>
      </div>
      <span className={`interrogation-sentinel${scene.sentinel ? " is-on" : ""}`} aria-hidden="true">
        SENTINEL
      </span>
    </div>
  );
}

/** Interrogation station scene (level 1.6): the station's lines go in through the stdin slot, answers come back as the shared output list. */
export function InterrogationSimulation({ level, outcome, running, playing, onDone, onCue }: Props) {
  const frames = useMemo(() => (outcome ? buildInterrogationTimeline(outcome, level) : []), [outcome, level]);
  const { frame, skip, reduced } = useTimelinePlayback(frames, { playing, onDone, onCue });
  const scene = running ? interrogationRunningScene(level) : (frame?.scene ?? interrogationIdleScene(level));
  const summary = !running && !playing && frames.length ? summarizeInterrogation(frames) : "";
  const alarm =
    scene.status.startsWith("TRẠM VỀ") ||
    scene.channel === "empty" ||
    scene.sentinel ||
    scene.laptop === "compile_error" ||
    scene.slots.some((s) => s.state === "error");
  const rows = [...scene.slots, ...scene.extra];

  return (
    <div className={`sim interrogation${scene.shake && !reduced ? " is-shaking" : ""}${scene.wave === "counter" ? " is-counter" : ""}`}>
      {scene.banner && (
        <div className="sim-banner" role="status">
          <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
            <path d="M8 1.5 L15 14.5 H1 Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 6v4M8 11.6v.8" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          {scene.banner}
        </div>
      )}
      <Station scene={scene} />
      <ol className="relay-list" aria-label="Câu trả lời gửi trạm">
        {rows.map((s) => (
          <AnswerRow key={`${scene.wave}-${s.state === "extra" ? "x" : ""}${s.line}`} slot={s} prompt={scene.promptMarks.find((m) => m.line === s.line)} />
        ))}
      </ol>
      <div className="sim-foot">
        <p className="sim-chip">{scene.chip ? `> ${scene.chip}` : ""}</p>
        <p className={`sim-status ${scene.station === "open" ? "scanner-pass" : alarm ? "scanner-alarm" : scene.status === "ĐANG XỬ LÝ" ? "scanner-scanning" : ""}`}>
          {scene.status}
        </p>
        {playing && !reduced && (
          <button type="button" className="btn btn-ghost btn-small" onClick={skip}>
            Bỏ qua hoạt cảnh <kbd>Esc</kbd>
          </button>
        )}
      </div>
      <p className="sr-only" aria-live="polite">
        {summary}
      </p>
    </div>
  );
}
