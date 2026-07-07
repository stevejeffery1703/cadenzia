// Entitlement + referral logic, shared by the auth and download routes.
//
// A user is "premium" (ungated, downloads on) when EITHER Stripe reports an
// active subscription, OR they hold comp Premium — a premium_until in the future,
// granted by a referral. Comp Premium has no Stripe subscription behind it, so it
// lives in its own column and is merged with subscription_status only here, at
// read time. Keeping them separate is what lets the account page tell a paying
// subscriber (who has a billing portal) apart from a comped one (who doesn't).

import { selectOne, updateRows, insertRow } from './db.js';

export const REFERRAL_REWARD_DAYS = 7;
// Cap how many referral weeks one account can earn, so the reward can't be farmed
// with throwaway invitee accounts. The invited friend is always rewarded; only
// the inviter's credit is capped.
export const REFERRAL_MAX_REWARDS = 10;

const DAY_MS = 24 * 60 * 60 * 1000;

export function isPremium(user) {
  if (!user) return false;
  if (user.subscription_status === 'active') return true;
  return !!user.premium_until && Date.parse(user.premium_until) > Date.now();
}

export function effectiveStatus(user) {
  return isPremium(user) ? 'active' : 'free';
}

// Grant (or extend) comp Premium. Stacks on any existing future grant so a second
// referral adds a week rather than resetting the clock.
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

// Apply a referral at signup: only for a brand-new invitee, only with a valid
// code that isn't their own. The friend always gets the taste of Premium; the
// inviter gets credited up to the farming cap.
export async function applyReferralOnSignup(env, referralCode, invitee) {
  if (!referralCode) return;

  const referrer = await selectOne(env, 'users', { referral_code: referralCode }, ['id']);
  if (!referrer || referrer.id === invitee.id) return;

  // invitee_id is UNIQUE — a listener is only ever referred once.
  const already = await selectOne(env, 'referrals', { invitee_id: invitee.id }, ['id']);
  if (already) return;

  await insertRow(env, 'referrals', { referrer_id: referrer.id, invitee_id: invitee.id });
  await grantPremiumDays(env, invitee.id, REFERRAL_REWARD_DAYS);

  const count = await countReferrals(env, referrer.id);
  if (count <= REFERRAL_MAX_REWARDS) {
    await grantPremiumDays(env, referrer.id, REFERRAL_REWARD_DAYS);
  }
}
