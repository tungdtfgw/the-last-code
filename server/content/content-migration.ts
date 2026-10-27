/** `updated_by` / `saved_by` of text that arrived with a migration. */
export const MIGRATION_USER = "migration";
/** D1 refuses a statement longer than 100 KB. */
export const MAX_STATEMENT_BYTES = 100_000;

const quote = (s: string) => `'${s.replaceAll("'", "''")}'`;

/** The text inserts in a migration file, to refuse a second migration for the same document. */
export const TEXT_INSERT = /INSERT INTO content_text \(doc_id, revision, text, updated_at, updated_by\) VALUES \('([^']+)'/g;

/**
 * The SQL that gives each document its first text: revision 1 and its history
 * row. Both skip a document that already has a row, so a migration never
 * overwrites text an admin saved. `JSON.stringify` escapes every control
 * character, so each statement is one line.
 */
export function contentMigrationSql(docs: { docId: string; text: unknown }[], at: string): string {
  const lines = [
    "-- Player-facing text (src/content/text-fields.ts): revision 1 of each document.",
    "-- Never overwrites a document that already has a row (text saved on the admin page).",
  ];
  for (const { docId, text } of docs) {
    const insert =
      `INSERT INTO content_text (doc_id, revision, text, updated_at, updated_by) VALUES (${quote(docId)}, 1, ${quote(JSON.stringify(text))}, ${quote(at)}, ${quote(MIGRATION_USER)})` +
      " ON CONFLICT(doc_id) DO NOTHING;";
    const history =
      "INSERT INTO content_text_history (doc_id, revision, text, saved_at, saved_by)" +
      ` SELECT doc_id, revision, text, updated_at, updated_by FROM content_text WHERE doc_id = ${quote(docId)} AND revision = 1 AND updated_by = ${quote(MIGRATION_USER)}` +
      " ON CONFLICT(doc_id, revision) DO NOTHING;";
    for (const statement of [insert, history]) {
      const bytes = Buffer.byteLength(statement, "utf8");
      if (bytes >= MAX_STATEMENT_BYTES) throw new Error(`${docId}: một câu lệnh dài ${bytes} byte, D1 chỉ nhận dưới ${MAX_STATEMENT_BYTES}`);
    }
    lines.push("", `-- ${docId}`, insert, history);
  }
  return `${lines.join("\n")}\n`;
}
