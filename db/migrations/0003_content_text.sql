-- Player-facing text edited on the admin page. Puzzle data stays in the bundled JSON;
-- the first revision of each document comes from a migration (0004 onwards).
CREATE TABLE content_text (
  doc_id TEXT PRIMARY KEY,                       -- 'level:1.4' | 'chapter:1'
  revision INTEGER NOT NULL CHECK (revision >= 1),
  text TEXT NOT NULL,                            -- JSON: text fields only (src/content/text-fields.ts)
  updated_at TEXT NOT NULL,
  updated_by TEXT NOT NULL                       -- admin username
);

-- Every saved revision, so a bad edit can be restored.
CREATE TABLE content_text_history (
  doc_id TEXT NOT NULL,
  revision INTEGER NOT NULL,
  text TEXT NOT NULL,
  saved_at TEXT NOT NULL,
  saved_by TEXT NOT NULL,
  PRIMARY KEY (doc_id, revision)
);
