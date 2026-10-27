import { validateChapterText, validateLevelText, type TextValidation } from "../../src/content/validate-text.js";
import { applyText, CHAPTER_TEXT, LEVEL_TEXT, type TextError } from "../../src/content/text-fields.js";
import type { Db } from "../db/db.js";
import type { BundledContent, BundledDoc } from "./bundled-content.js";
import { readAllTexts, readText, saveText, type DocKind, type StoredText } from "./content-store.js";

const specOf = (kind: DocKind) => (kind === "level" ? LEVEL_TEXT : CHAPTER_TEXT);
export const validateDocText = (kind: DocKind, puzzle: unknown, text: unknown): TextValidation =>
  kind === "level" ? validateLevelText(puzzle, text) : validateChapterText(puzzle, text);

/** A bundled document whose text never reached D1: the admin page lists it but cannot open it. */
export const NO_TEXT_ERROR: TextError = { path: "", message: "chưa có câu chữ: thêm migration (npm run content:migration)" };

/** What a stored text gives on today's puzzle: the elements that no longer line up, and validator errors. */
function check(doc: BundledDoc, text: unknown): { drift: string[]; errors: TextError[] } {
  if (doc.errors.length) return { drift: [], errors: doc.errors.map((m) => ({ path: "", message: m })) };
  const result = validateDocText(doc.kind, doc.puzzle, text);
  return { drift: applyText(doc.puzzle, text, specOf(doc.kind)).drift, errors: result.ok ? [] : result.errors };
}

function summary(doc: BundledDoc, row: StoredText | undefined) {
  const { drift, errors } = row ? check(doc, row.text) : { drift: [], errors: [NO_TEXT_ERROR] };
  return {
    docId: doc.docId,
    kind: doc.kind,
    id: doc.id,
    title: doc.title,
    /** 0: no row in D1, the document cannot be edited until a migration adds its text. */
    revision: row?.revision ?? 0,
    updatedAt: row?.updatedAt ?? null,
    updatedBy: row?.updatedBy ?? null,
    drift,
    errors,
  };
}

export async function listDocs(db: Db, content: BundledContent) {
  const rows = await readAllTexts(db);
  return { docs: content.docs.map((d) => summary(d, rows[d.docId])) };
}

export type GetResult = { status: 200; body: ReturnType<typeof summary> & { text: unknown } } | { status: 404; body: { error: "no_text" } };

export async function getDoc(db: Db, doc: BundledDoc): Promise<GetResult> {
  const row = await readText(db, doc.docId);
  if (!row) return { status: 404, body: { error: "no_text" } };
  return { status: 200, body: { ...summary(doc, row), text: row.text } };
}

export type PutResult =
  | { status: 200; body: { revision: number; updatedAt: string } }
  | { status: 422; body: { error: "invalid_text"; errors: TextError[] } }
  | { status: 404; body: { error: "no_text" } }
  | { status: 409; body: { error: "stale_revision"; revision: number; updatedAt: string | null; updatedBy: string | null } };

/** Checks the text on this deploy's puzzle, then writes it only over `baseRevision`. Never creates a document. */
export async function putDoc(
  db: Db,
  doc: BundledDoc,
  input: { baseRevision: number; text: unknown; username: string; now: Date },
): Promise<PutResult> {
  const result = validateDocText(doc.kind, doc.puzzle, input.text);
  if (!result.ok) return { status: 422, body: { error: "invalid_text", errors: result.errors } };
  const saved = await saveText(db, { docId: doc.docId, baseRevision: input.baseRevision, text: result.text, username: input.username, now: input.now });
  if (!saved.ok) {
    if (saved.stale.revision === 0) return { status: 404, body: { error: "no_text" } };
    return { status: 409, body: { error: "stale_revision", ...saved.stale } };
  }
  return { status: 200, body: { revision: saved.revision, updatedAt: saved.updatedAt } };
}
