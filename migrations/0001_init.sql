-- Cadenzia database schema (Cloudflare D1 / SQLite).
-- Applied via `wrangler d1 migrations apply cadenzia-db`.
--
-- D1 has no public REST endpoint of its own — only this Worker's binding can
-- reach it, so the Worker's route handlers (src/worker/routes/*) are the sole
-- access boundary. There is no RLS layer to configure here, unlike the old
-- Supabase/PostgREST setup.

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT,
  subscription_status TEXT NOT NULL DEFAULT 'free', -- 'free' | 'active'
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'free',
  current_period_end TEXT
);

CREATE TABLE IF NOT EXISTS email_subscribers (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  consent_given INTEGER NOT NULL DEFAULT 0,
  unsubscribed INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- LISTENING SESSIONS (privacy-first stats)
CREATE TABLE IF NOT EXISTS listening_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  track_id TEXT NOT NULL,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- SHARES (milestones — Phase 2)
CREATE TABLE IF NOT EXISTS shares (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  share_token TEXT NOT NULL,
  platform TEXT,
  redeemed INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- PLAY COUNTER (honest social proof) — a single-row global counter, bumped
-- atomically via `UPDATE ... RETURNING` (see incrementPlays in lib/db.js) so
-- concurrent plays never clobber each other.
CREATE TABLE IF NOT EXISTS play_counter (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  count INTEGER NOT NULL DEFAULT 0
);
INSERT OR IGNORE INTO play_counter (id, count) VALUES (1, 0);
