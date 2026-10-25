import { useMemo, useState } from "react";
import type { AudioControls } from "../audio/use-audio";
import { buildStory } from "../story/build-story";
import { chapterTotals, type ChapterContext, type ProgressSnapshot } from "../story/progression";
import { CutscenePlayer } from "./cutscene-player";
import { MuteButton } from "./mute-button";
import { StoryGate } from "./story-gate";
import { storyLabel } from "./story-labels";

export interface StoryScreenProps {
  storyId: string;
  ctx: ChapterContext;
  snapshot: ProgressSnapshot;
  audio: AudioControls;
  /** Played to the end or skipped: record it as seen (the app then moves on, except for the teaser). */
  onFinish(): void;
  /** Teaser end panel: VỀ BẢN ĐỒ. */
  onMap(): void;
}

/** One story route. Opened directly (no gesture yet), it starts behind a gate whose click unlocks audio. */
export function StoryScreen({ storyId, ctx, snapshot, audio, onFinish, onMap }: StoryScreenProps) {
  // Decided once: a later gesture (the gate's own pointerdown) must not drop the gate under the click.
  const [started, setStarted] = useState(audio.gestured);
  const beats = useMemo(() => buildStory(storyId, ctx), [storyId, ctx]);
  const totals = chapterTotals(ctx, snapshot);
  // The prologue shows the Neural-ID before anything is built.
  const collected = storyId === "prologue" ? [] : totals.components.map((c) => c.slot);

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
      slots={ctx.chapter.neural_id_slots}
      onFinish={onFinish}
      controls={<MuteButton muted={audio.muted} onToggle={audio.toggleMute} />}
      endPanel={
        storyId === "teaser" ? (
          <div className="story-end-card">
            <button type="button" className="btn btn-run title-primary" onClick={onMap}>
              VỀ BẢN ĐỒ
            </button>
            {totals.stars < totals.maxStars && (
              <p className="story-end-note">Chơi lại để lấy đủ 3 sao ở mỗi cổng trong lúc chờ.</p>
            )}
          </div>
        ) : undefined
      }
    />
  );
}
