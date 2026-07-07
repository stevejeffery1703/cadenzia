// Entitlement + trial/referral logic, shared by the auth and download routes.
//
// A user is "premium" (ungated, downloads on) when EITHER Stripe reports an
// active subscription, OR they hold comp Premium — a premium_until in the future.
// Comp Premium has no Stripe subscription behind it, so it lives in its own column
// and is merged with subscription_status only here, at read time. Keeping them
// separate is what lets the account page tell a paying subscriber (who has a
// billing portal) apart from someone on a free trial (who doesn't).
//
// Comp Premium is granted in exactly one place: the free first week every new
// account gets — doubled to two weeks when they arrive through a referral link.

import { selectOne, updateRows, insertRow } from './db.js';

// Every new account's free first week; a referred signup gets both weeks.
export const INTRO_TRIAL_DAYS = 7;
export const REFERRED_TRIAL_DAYS = 14;

const DAY_MS = 24 * 60 * 60 * 1000;

export function isPremium(user) {
  if (!user) return false;
  if (user.subscription_status === 'active') return true;
  return !!user.premium_until && Date.parse(user.premium_until) > Date.now();
}

// Grant (or extend) comp Premium. Stacks on any existing future grant rather than
// resetting the clock (so a grant added to remaining trial time extends it).
export async function grantPremiumDays(env, userId, days) {
  const row = await selectOne(env, 'users', { id: userId }, ['premium_until']);
  const now = Date.now();
  const base =
    row?.premium_until && Date.parse(row.premium_until) > now ? Date.parse(row.premium_until) : now;
  const until = new Date(base + days * DAY_MS).toISOString();
  await updateRows(env, 'users', { id: userId }, { premium_until: until });
  return until;
}

const CODE_ALPHABET = 'abcdefghijkmnpqrstuvwxyz23456789'; // no 0/o/1/l look-alikes
function randomCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  let s = '';
  for (const b of bytes) s += CODE_ALPHABET[b % CODE_ALPHABET.length];
  return s;
}

// Ensure a user has a referral code, minting one on demand (this also backfills
// accounts created before referrals existed). Retries past the astronomically
// unlikely collision with the unique index. Mutates `user` and returns the code.
export async function ensureReferralCode(env, user) {
  if (user.referral_code) return user.referral_code;
  for (let i = 0; i < 4; i += 1) {
    const code = randomCode();
    try {
      await updateRows(env, 'users', { id: user.id }, { referral_code: code });
      user.referral_code = code;
      return code;
    } catch (err) {
      // Only a code collision is worth retrying. Anything else (a missing column
      // pre-migration, a D1 outage) must surface rather than be masked by three
      // more doomed writes and a silent null.
      if (!/unique/i.test(String(err && err.message))) throw err;
    }
  }
  return null;
}

export async function countReferrals(env, referrerId) {
  const row = await env.DB.prepare('SELECT COUNT(*) AS count FROM referrals WHERE referrer_id = ?')
    .bind(referrerId)
    .first();
  return row?.count ?? 0;
}

// The free first week every new account gets. If they arrived through a valid
// referral link — a real, different referrer — the week is doubled to two, and
// the referral is recorded so the inviter can see their join count. The inviter
// gets nothing dangled: the reward is giving a friend a better start. Self-
// contained and forgiving — the base week is still granted even if referral
// recording fails. Returns { days, referred } so the client can greet them.
// New accounts only.
export async function grantWelcomePremium(env, referralCode, newUser) {
  let referred = false;

  if (referralCode) {
    const referrer = await selectOne(env, 'users', { referral_code: referralCode }, ['id']);
    if (referrer && referrer.id !== newUser.id) {
      try {
        // invitee_id is UNIQUE — recording also guards against a double-referral.
        await insertRow(env, 'referrals', { referrer_id: referrer.id, invitee_id: newUser.id });
        referred = true;
      } catch {
        // Already referred, or a transient error — fall back to the standard week.
      }
    }
  }

  const days = referred ? REFERRED_TRIAL_DAYS : INTRO_TRIAL_DAYS;
  await grantPremiumDays(env, newUser.id, days);
  return { days, referred };
}
