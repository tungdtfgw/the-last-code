-- Drafts are ordered by when the player typed them, not by when the request arrived:
-- a retried or slow request must never put an older draft back.
ALTER TABLE level_progress ADD COLUMN draft_rev INTEGER NOT NULL DEFAULT 0;
