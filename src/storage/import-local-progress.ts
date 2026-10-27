import type { AccountApi } from "../account/account-api";
import { clearLocalProgress, readLocalProgress } from "./local-storage-repository";
import type { ProgressSnapshotDto } from "./progress-repository";

/** Stays well under the server's 512 KB import limit and the gateway's batch limit. */
const MAX_IMPORT_BYTES = 400 * 1024;

/** Stars, runs, hints and stories are tiny; drafts are what make an import big, so they go first. */
function fitForImport(local: ProgressSnapshotDto): ProgressSnapshotDto {
  if (new TextEncoder().encode(JSON.stringify(local)).length <= MAX_IMPORT_BYTES) return local;
  const levels = Object.fromEntries(Object.entries(local.levels).map(([id, { draft: _draft, ...rest }]) => [id, rest]));
  return { levels: levels as ProgressSnapshotDto["levels"], story: local.story };
}

export type ImportOutcome = "none" | "imported" | "discarded" | "kept";

function getStorage(get: () => Storage | undefined): Storage | null {
  try {
    return get() ?? null;
  } catch {
    return null;
  }
}

/**
 * Folds progress from an older build into the signed-in account, then clears it
 * from this browser (QĐ-10). A network error or 5xx keeps it for the next visit
 * (the import is idempotent); a 4xx means the server will never take this data,
 * so it is dropped instead of failing on every start.
 */
export async function importLocalProgress(
  api: Pick<AccountApi, "importProgress">,
  get: () => Storage | undefined = () => globalThis.localStorage,
): Promise<ImportOutcome> {
  const storage = getStorage(get);
  const local = storage && readLocalProgress(storage);
  if (!storage || !local) return "none";
  const res = await api.importProgress(fitForImport(local));
  if (res.ok) {
    clearLocalProgress(storage);
    return "imported";
  }
  if (res.status === 0 || res.status >= 500 || res.status === 401) return "kept";
  console.warn(`[storage] máy chủ từ chối tiến độ cũ (${res.status}), bỏ bản trên máy`);
  clearLocalProgress(storage);
  return "discarded";
}
