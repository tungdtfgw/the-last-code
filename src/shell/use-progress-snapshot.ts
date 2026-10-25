import { useCallback, useEffect, useRef, useState } from "react";
import type { ProgressRepository, StarCount } from "../storage/progress-repository";
import type { ProgressSnapshot } from "../story/progression";

/**
 * Best stars of every chapter level plus the seen stories, re-read from the
 * repository whenever `key` (the route) changes. Null until the first read.
 */
export function useProgressSnapshot(repository: ProgressRepository, levelIds: string[], key: string) {
  const [snapshot, setSnapshot] = useState<ProgressSnapshot | null>(null);
  const [readFor, setReadFor] = useState<string | null>(null);
  const ids = useRef(levelIds);
  ids.current = levelIds;

  const read = useCallback(async (): Promise<ProgressSnapshot> => {
    try {
      const [levels, story] = await Promise.all([Promise.all(ids.current.map((id) => repository.getLevel(id))), repository.getStory()]);
      const stars: Record<string, StarCount> = {};
      ids.current.forEach((id, i) => (stars[id] = levels[i].bestStars));
      return { stars, seen: new Set(story.seen) };
    } catch (err) {
      // A remote repository can fail; play on as a new player rather than show a blank screen.
      console.error("[progress] không đọc được tiến độ", err);
      return { stars: {}, seen: new Set() };
    }
  }, [repository]);

  const refresh = useCallback(async () => {
    const snap = await read();
    setSnapshot(snap);
    return snap;
  }, [read]);

  useEffect(() => {
    let alive = true;
    void read().then((snap) => {
      if (!alive) return;
      setSnapshot(snap);
      setReadFor(key);
    });
    return () => {
      alive = false;
    };
  }, [read, key]);

  /** True when the snapshot was read for the current route. */
  const fresh = readFor === key;
  return { snapshot, fresh, refresh };
}
