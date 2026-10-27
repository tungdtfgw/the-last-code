import { all, first, sql, type Db, type Row } from "../db/db.js";

/** `level:<id>` or `chapter:<n>`: one row per document in `content_text`. */
export type DocKind = "level" | "chapter";
export const docIdOf = (kind: DocKind, id: string) => `${kind}:${id}`;

export interface StoredText {
  revision: number;
  text: unknown;
  updatedAt: string;
  updatedBy: string;
}

export interface RevisionInfo {
  revision: number;
  savedAt: string;
  savedBy: string;
}

const stored = (r: Row): StoredText => ({
  revision: Number(r.revision),
  text: JSON.parse(String(r.text)),
  updatedAt: String(r.updated_at),
  updatedBy: String(r.updated_by),
});

/** Every document that has a row, keyed by doc id. */
export async function readAllTexts(db: Db): Promise<Record<string, StoredText>> {
  const rows = await all(db, "SELECT doc_id, revision, text, updated_at, updated_by FROM content_text ORDER BY doc_id");
  return Object.fromEntries(rows.map((r) => [String(r.doc_id), stored(r)]));
}

export async function readText(db: Db, docId: string): Promise<StoredText | null> {
  const row = await first(db, "SELECT revision, text, updated_at, updated_by FROM content_text WHERE doc_id = ?1", docId);
  return row ? stored(row) : null;
}

/** Saved revisions, newest first. */
export async function listHistory(db: Db, docId: string, limit = 50): Promise<RevisionInfo[]> {
  const rows = await all(
    db,
    "SELECT revision, saved_at, saved_by FROM content_text_history WHERE doc_id = ?1 ORDER BY revision DESC LIMIT ?2",
    docId,
    limit,
  );
  return rows.map((r) => ({ revision: Number(r.revision), savedAt: String(r.saved_at), savedBy: String(r.saved_by) }));
}

export async function readRevision(db: Db, docId: string, revision: number): Promise<(RevisionInfo & { text: unknown }) | null> {
  const row = await first(db, "SELECT revision, text, saved_at, saved_by FROM content_text_history WHERE doc_id = ?1 AND revision = ?2", docId, revision);
  return row
    ? { revision: Number(row.revision), text: JSON.parse(String(row.text)), savedAt: String(row.saved_at), savedBy: String(row.saved_by) }
    : null;
}

export type SaveResult =
  | { ok: true; revision: number; updatedAt: string; updatedBy: string }
  | { ok: false; stale: { revision: number; updatedAt: string | null; updatedBy: string | null } };

/**
 * Saves a new revision only if the stored one is still `baseRevision`. Never
 * creates a row: a document gets its first text from a migration. One batch:
 * the conditional write, its history row (guarded by `changes() = 1`, so a
 * refused write never adds history), then the current row (revision 0 in the
 * refusal: the document has no row). The text is sent once; the history copies it.
 */
export async function saveText(
  db: Db,
  input: { docId: string; baseRevision: number; text: unknown; username: string; now: Date },
): Promise<SaveResult> {
  const { docId, baseRevision, username } = input;
  const write = sql(
    "UPDATE content_text SET revision = revision + 1, text = ?2, updated_at = ?3, updated_by = ?4 WHERE doc_id = ?1 AND revision = ?5 RETURNING revision",
    docId,
    JSON.stringify(input.text),
    input.now.toISOString(),
    username,
    baseRevision,
  );
  const [written, , current] = await db.batch([
    write,
    sql(
      `INSERT INTO content_text_history (doc_id, revision, text, saved_at, saved_by)
       SELECT doc_id, revision, text, updated_at, updated_by FROM content_text WHERE changes() = 1 AND doc_id = ?1`,
      docId,
    ),
    sql("SELECT revision, updated_at, updated_by FROM content_text WHERE doc_id = ?1", docId),
  ]);
  const row = current[0];
  if (written.length === 0) {
    return {
      ok: false,
      stale: { revision: row ? Number(row.revision) : 0, updatedAt: row ? String(row.updated_at) : null, updatedBy: row ? String(row.updated_by) : null },
    };
  }
  return { ok: true, revision: Number(written[0].revision), updatedAt: String(row.updated_at), updatedBy: String(row.updated_by) };
}
