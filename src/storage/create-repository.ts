import { LocalStorageRepository } from "./local-storage-repository";
import { MemoryRepository } from "./memory-repository";
import type { ProgressRepository } from "./progress-repository";

const PROBE_KEY = "the-last-code:probe";

/** Pick `localStorage` when it really works, otherwise the in-memory fallback. */
export function createRepository(getStorage: () => Storage | undefined = () => globalThis.localStorage): ProgressRepository {
  try {
    const storage = getStorage();
    if (!storage) return new MemoryRepository(false);
    storage.setItem(PROBE_KEY, "1");
    storage.removeItem(PROBE_KEY);
    return new LocalStorageRepository(storage);
  } catch {
    return new MemoryRepository(false);
  }
}
