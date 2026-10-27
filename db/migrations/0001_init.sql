-- Accounts, sessions, one-time email tokens, game progress and rate-limit counters.
-- Times are ISO 8601 UTC strings, like `updatedAt` on the client.

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password_md5 TEXT NOT NULL,
  salt TEXT NOT NULL,
  activated_at TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE sessions (
  id_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL
);
CREATE INDEX sessions_user ON sessions(user_id);

CREATE TABLE email_tokens (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  purpose TEXT NOT NULL CHECK (purpose IN ('activate', 'reset')),
  expires_at TEXT NOT NULL,
  used_at TEXT
);
CREATE INDEX email_tokens_user ON email_tokens(user_id);

CREATE TABLE level_progress (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  level_id TEXT NOT NULL,
  draft TEXT,
  best_stars INTEGER NOT NULL DEFAULT 0 CHECK (best_stars BETWEEN 0 AND 3),
  runs INTEGER NOT NULL DEFAULT 0 CHECK (runs >= 0),
  hints_opened INTEGER NOT NULL DEFAULT 0 CHECK (hints_opened BETWEEN 0 AND 3),
  updated_at TEXT NOT NULL,
  PRIMARY KEY (user_id, level_id)
);

CREATE TABLE story_seen (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  story_id TEXT NOT NULL,
  seen_at TEXT NOT NULL,
  PRIMARY KEY (user_id, story_id)
);

CREATE TABLE rate_limits (
  key TEXT PRIMARY KEY,
  window_start TEXT NOT NULL,
  count INTEGER NOT NULL
);
