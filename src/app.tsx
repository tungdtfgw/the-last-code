import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AccountGate, type GameProps } from "./account/account-gate";
import { useAudio } from "./audio/use-audio";
import { getDefaultRegistry } from "./game/level-registry";
import { routeHash, sameRoute } from "./shell/route";
import { useHashRoute } from "./shell/use-hash-route";
import { useProgressSnapshot } from "./shell/use-progress-snapshot";
import { getChapter } from "./story/chapter";
import {
  buildChapterContext,
  chapterTotals,
  continueAfterLevel,
  guardRoute,
  isReturning,
  learnEnd,
  nodeStates,
  seenStories,
  storyEnd,
  titleContinue,
  type ChapterContext,
  type Route,
} from "./story/progression";
import { ChapterMap } from "./ui/chapter-map";
import { ErrorBoundary } from "./ui/error-boundary";
import { FatalScreen } from "./ui/fatal-screen";
import { GameScreen } from "./ui/game-screen";
import { KnowledgeScreen } from "./ui/knowledge-screen";
import { StoryScreen } from "./ui/story-screen";
import { TitleScreen } from "./ui/title-screen";
import { isTyping } from "./ui/is-typing";

/** The entry gate after a story ignores clicks this long. */
const ENTRY_GUARD_AFTER_STORY_MS = 400;

/**
 * Game shell: hash routes to the title, map, stories and levels, for one
 * signed-in player. Audio lives here so one AudioContext lasts the session. Every
 * route passes `guardRoute`; all progression decisions come from `progression.ts`.
 */
function Shell({ ctx, repository, user, onAccount }: { ctx: ChapterContext } & GameProps) {
  const audio = useAudio(repository);
  const { route, navigate } = useHashRoute();
  const key = routeHash(route);
  const { snapshot, fresh, refresh } = useProgressSnapshot(repository, ctx.order, key);
  const [persistent, setPersistent] = useState(repository.persistent);
  useEffect(() => repository.onPersistenceLost(() => setPersistent(false)), [repository]);

  // M toggles sound on every screen, outside text fields.
  const { toggleMute } = audio;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "m" || e.key === "M") && !e.ctrlKey && !e.metaKey && !e.altKey && !e.repeat && !isTyping(e.target)) toggleMute();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggleMute]);

  // A level reached straight from a story gets the entry guard; decided once per level visit.
  const prevRoute = useRef<Route | null>(null);
  const entry = useRef<{ key: string; guardMs: number } | null>(null);
  if (route.kind !== "level") entry.current = null;
  else if (entry.current?.key !== key) {
    entry.current = { key, guardMs: prevRoute.current?.kind === "story" ? ENTRY_GUARD_AFTER_STORY_MS : 0 };
  }
  // Story or knowledge summary opened from the map: it returns to the map when it ends.
  const replaying = useRef<string | null>(null);
  useEffect(() => {
    prevRoute.current = route;
    if (key !== replaying.current) replaying.current = null;
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  const guarded = fresh && snapshot ? guardRoute(route, ctx, snapshot) : null;
  const redirect = guarded !== null && !sameRoute(guarded, route);
  useEffect(() => {
    if (redirect && guarded) navigate(guarded, { replace: true });
  }, [redirect, guarded, navigate]);

  const startAudio = useCallback(() => {
    void audio.unlock().then(() => audio.play("pulse"));
  }, [audio]);

  const finishStory = useCallback(
    async (id: string) => {
      await repository.markStorySeen(id);
      const snap = await refresh();
      if (id === "teaser") return; // its end panel leads to the map
      // The player may have left (Back) while this was saving.
      if (window.location.hash !== routeHash({ kind: "story", id })) return;
      const replay = replaying.current === routeHash({ kind: "story", id });
      navigate(replay ? { kind: "map" } : storyEnd(id, ctx, snap), { replace: true });
    },
    [repository, refresh, navigate, ctx],
  );

  if (!fresh || !snapshot || redirect) return null;

  switch (route.kind) {
    case "title":
      return (
        <TitleScreen
          returning={isReturning(snapshot)}
          persistent={persistent}
          username={user.username}
          onAccount={onAccount}
          muted={audio.muted}
          onStart={() => {
            startAudio();
            navigate({ kind: "story", id: "prologue" });
          }}
          onContinue={() => {
            startAudio();
            navigate(titleContinue(ctx, snapshot));
          }}
          onMap={() => navigate({ kind: "map" })}
          onToggleMute={audio.toggleMute}
        />
      );
    case "map": {
      const totals = chapterTotals(ctx, snapshot);
      const lore = [...ctx.built.values()]
        .filter((l) => (snapshot.stars[l.id] ?? 0) > 0 && l.lore_fragment.trim())
        .map((l) => ({ levelId: l.id, text: l.lore_fragment }));
      return (
        <ChapterMap
          nodes={nodeStates(ctx, snapshot)}
          levels={ctx.built}
          totals={totals}
          seenStories={seenStories(ctx, snapshot)}
          lore={lore}
          persistent={persistent}
          muted={audio.muted}
          onPlay={(id) => navigate({ kind: "level", id })}
          knowledge={[...ctx.built.values()]
            .filter((l) => l.knowledge_summary && (snapshot.stars[l.id] ?? 0) > 0)
            .map((l) => ({ levelId: l.id, title: l.title }))}
          onReplay={(id) => {
            replaying.current = routeHash({ kind: "story", id });
            navigate({ kind: "story", id });
          }}
          onKnowledge={(id) => {
            replaying.current = routeHash({ kind: "learn", id });
            navigate({ kind: "learn", id });
          }}
          onTitle={() => navigate({ kind: "title" })}
          onToggleMute={audio.toggleMute}
        />
      );
    }
    case "story":
      return (
        <StoryScreen
          key={route.id}
          storyId={route.id}
          ctx={ctx}
          snapshot={snapshot}
          audio={audio}
          onFinish={() => void finishStory(route.id)}
          onMap={() => navigate({ kind: "map" }, { replace: true })}
        />
      );
    case "learn": {
      const level = ctx.built.get(route.id)!;
      const learnKey = key;
      return (
        <KnowledgeScreen
          key={route.id}
          level={{ ...level, knowledge_summary: level.knowledge_summary! }}
          onContinue={() => {
            if (replaying.current === learnKey) return navigate({ kind: "map" }, { replace: true });
            void refresh().then((snap) => {
              // The player may have left (Back) while this was loading.
              if (window.location.hash === learnKey) navigate(learnEnd(level.id, ctx, snap), { replace: true });
            });
          }}
        />
      );
    }
    case "level": {
      const level = ctx.built.get(route.id)!;
      return (
        <GameScreen
          key={route.id}
          level={level}
          repository={repository}
          audio={audio}
          entryGuardMs={entry.current?.guardMs ?? 0}
          onMap={() => navigate({ kind: "map" })}
          onContinue={() => {
            void refresh().then((snap) => navigate(continueAfterLevel(level.id, ctx, snap)));
          }}
        />
      );
    }
  }
}

function Boot() {
  const chapter = getChapter();
  const ctx = useMemo(() => (chapter.ok ? buildChapterContext(chapter.chapter, getDefaultRegistry()) : null), [chapter]);
  if (!ctx) {
    return (
      <FatalScreen
        title="DỮ LIỆU CHƯƠNG HỎNG"
        message="Không đọc được dữ liệu chương 1."
        detail={chapter.ok ? [] : chapter.errors.slice(0, 8)}
        action={{ label: "Tải lại", onClick: () => window.location.reload() }}
      />
    );
  }
  return <AccountGate renderGame={(game) => <Shell key={game.user.id} ctx={ctx} {...game} />} />;
}

export function App() {
  return (
    <ErrorBoundary>
      <Boot />
    </ErrorBoundary>
  );
}
