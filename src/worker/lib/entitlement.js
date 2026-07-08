// Entitlement logic, shared by the auth and download routes.
//
// A user is "premium" (ungated, downloads on) when EITHER Stripe reports an
// active subscription, OR they hold comp Premium — a premium_until in the future.
// Comp Premium has no Stripe subscription behind it, so it lives in its own column
// and is merged with subscription_status only here, at read time. Keeping them
// separate is what lets the account page tell a paying subscriber (who has a
// billing portal) apart from a comped one.
//
// Comp Premium is no longer granted automatically — the intro free-week and the
// referral doubling were removed when the model collapsed to two tiers (free
// hour/day → paid). grantPremiumDays stays for manual/support grants, and isPremium
// still honours any comp time already granted so those keep working until they lapse.

import { selectOne, updateRows } from './db.js';

const DAY_MS = 24 * 60 * 60 * 1000;

export function isPremium(user) {
  if (!user) return false;
  if (user.subscription_status === 'active') return true;
  return !!user.premium_until && Date.parse(user.premium_until) > Date.now();
}

// Grant (or extend) comp Premium. Stacks on any existing future grant rather than
// resetting the clock. Nothing in the normal signup flow calls this anymore — it's
// kept for manual/support comps (and any future founding-member style grant).
export async function grantPremiumDays(env, userId, days) {
  const row = await selectOne(env, 'users', { id: userId }, ['premium_until']);
  const now = Date.now();
  const base =
    row?.premium_until && Date.parse(row.premium_until) > now ? Date.parse(row.premium_until) : now;
  const until = new Date(base + days * DAY_MS).toISOString();
  await updateRows(env, 'users', { id: userId }, { premium_until: until });
  return until;
}
