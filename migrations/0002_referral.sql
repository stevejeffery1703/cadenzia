-- Referral + comp Premium (2026-07).
-- Applied via `wrangler d1 migrations apply cadenzia-db`.
--
-- Two-sided referral: an invited friend and the person who invited them each get
-- a week of Premium. Premium earned this way is "comp" — there is no Stripe
-- subscription behind it — so it is tracked as an expiry on the user, kept
-- separate from subscription_status and merged with it only at read time
-- (see src/worker/lib/entitlement.js).

ALTER TABLE users ADD COLUMN premium_until TEXT;   -- ISO8601 expiry of comp/referral Premium
ALTER TABLE users ADD COLUMN referral_code TEXT;   -- opaque, per-user invite code

-- SQLite can't add a UNIQUE column inline, so uniqueness is a separate index.
-- NULLs are treated as distinct, so accounts created before referrals existed
-- (referral_code NULL) don't collide — they get a code minted on next /me.
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);

-- One row per successful referral. invitee_id is UNIQUE: a listener can only be
-- referred once, so the reward can't be farmed by re-referring the same account.
CREATE TABLE IF NOT EXISTS referrals (
  id TEXT PRIMARY KEY,
  referrer_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  invitee_id TEXT UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
