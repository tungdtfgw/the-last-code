import { useMemo, useState } from "react";
import type { AudioControls } from "../audio/use-audio";
import { buildStory } from "../story/build-story";
import { chapterTotals, isChapterEnd, nextChapterAfterEnd, prologueId, storyChapter, type GameContext, type ProgressSnapshot } from "../story/progression";
import { CutscenePlayer } from "./cutscene-player";
import { MuteButton } from "./mute-button";
import { StoryGate } from "./story-gate";
import { storyLabel } from "./story-labels";

export interface StoryScreenProps {
  storyId: string;
  ctx: GameContext;
  snapshot: ProgressSnapshot;
  audio: AudioControls;
  /** Opened from the map's replay list: a chapter ending then only leads back to the map. */
  replaying: boolean;
  /** Played to the end or skipped: record it as seen (the app then moves on, except for a chapter ending). */
  onFinish(): void;
  /** Chapter ending panel: TIẾP TỤC into the next chapter. */
  onContinue(): void;
  /** Chapter ending panel: VỀ BẢN ĐỒ. */
  onMap(): void;
}

/** One story route. Opened directly (no gesture yet), it starts behind a gate whose click unlocks audio. */
export function StoryScreen({ storyId, ctx, snapshot, audio, replaying, onFinish, onContinue, onMap }: StoryScreenProps) {
  // Decided once: a later gesture (the gate's own pointerdown) must not drop the gate under the click.
  const [started, setStarted] = useState(audio.gestured);
  const beats = useMemo(() => buildStory(storyId, ctx), [storyId, ctx]);
  const chapter = storyChapter(storyId, ctx) ?? 1;
  const totals = chapterTotals(ctx, snapshot, chapter);
  // A chapter's opening shows its bar before anything is built.
  const collected = storyId === prologueId(chapter) ? [] : totals.components.map((c) => c.slot);
  const goesOn = !replaying && nextChapterAfterEnd(storyId, ctx) !== undefined;

  if (!beats) return null;
  if (!started) {
    return (
      <StoryGate
        title={storyLabel(storyId)}
        onEnter={() => {
          void audio.unlock();
          setStarted(true);
        }}
      />
    );
  }
  return (
    <CutscenePlayer
      beats={beats}
      play={audio.play}
      collected={collected}
      slots={totals.slots}
      found={chapter}
      onFinish={onFinish}
      controls={<MuteButton muted={audio.muted} onToggle={audio.toggleMute} />}
      endPanel={
        isChapterEnd(storyId, ctx) ? (
          <div className="story-end-card">
            {goesOn && (
              <button type="button" className="btn btn-run title-primary" onClick={onContinue}>
                TIẾP TỤC
              </button>
            )}
            <button type="button" className={`btn ${goesOn ? "btn-ghost" : "btn-run title-primary"}`} onClick={onMap}>
              VỀ BẢN ĐỒ
            </button>
            {!goesOn && totals.stars < totals.maxStars && (
              <p className="story-end-note">
                {chapter === 1 ? "Chơi lại để lấy đủ 3 sao ở mỗi cổng trong lúc chờ." : "Chơi lại để lấy đủ 3 sao ở mỗi màn của chương này."}
              </p>
            )}
          </div>
        ) : undefined
      }
    />
  );
}
