// Auth: passwordless magic-link style, kept deliberately simple.
//   POST /api/auth/magic-link  → emails a 6-digit code (via Resend), stores it in KV
//   POST /api/auth/verify      → checks code, upserts user, returns our session JWT
//   GET  /api/auth/me          → returns the current user + subscription status
//   POST /api/auth/delete      → deletes user + all associated data
//
// For production you may prefer a dedicated auth provider's own magic links;
// this keeps the MVP self-contained with one fewer moving part.

import { json } from '../middleware/cors.js';
import { sign, authedUser } from '../lib/jwt.js';
import { selectOne, insertRow, deleteRows } from '../lib/db.js';
import { isPremium } from '../lib/entitlement.js';
import { isRateLimited } from '../lib/rateLimit.js';
import { sendEmail, emailShell } from './email.js';

const sixDigits = () => String(Math.floor(100000 + Math.random() * 900000));

export async function magicLink(request, env) {
  const { email } = await request.json();
  if (!email) return json({ error: 'Email required' }, { status: 400, env });
  const normalizedEmail = email.toLowerCase();

  // Cap requests per email (spam target) and per IP (spam source) separately.
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const [emailLimited, ipLimited] = await Promise.all([
    isRateLimited(env, `otp:email:${normalizedEmail}`, { limit: 3, windowSeconds: 900 }),
    isRateLimited(env, `otp:ip:${ip}`, { limit: 10, windowSeconds: 900 }),
  ]);
  if (emailLimited || ipLimited) {
    return json({ error: 'Too many requests. Try again in a few minutes.' }, { status: 429, env });
  }

  const code = sixDigits();
  // Store the code for 10 minutes, keyed by email.
  await env.SESSIONS.put(`otp:${normalizedEmail}`, code, { expirationTtl: 600 });

  await sendEmail(env, {
    to: normalizedEmail,
    subject: `Your sign-in code`,
    text: `Your sign-in code is ${code}. It expires in 10 minutes.`,
    html: emailShell(`
      <tr>
        <td style="text-align:center;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#8A8375;padding-bottom:12px;">
          Your sign-in code
        </td>
      </tr>
      <tr>
        <td style="text-align:center;font-family:Georgia,'Times New Roman',serif;font-size:40px;letter-spacing:0.08em;color:#232019;padding-bottom:16px;">
          ${code}
        </td>
      </tr>
      <tr>
        <td style="text-align:center;font-size:14px;color:#6B6358;">
          Expires in 10 minutes. If you didn't request this, you can ignore this email.
        </td>
      </tr>
    `),
  });

  return json({ ok: true }, { env });
}

export async function verify(request, env) {
  const { email, otp } = await request.json();
  if (!email || !otp) return json({ error: 'Email and code required' }, { status: 400, env });

  const normalizedEmail = email.toLowerCase();

  // Brute-forcing a 6-digit code is the real risk here, so verification is
  // throttled two ways: a per-IP cap stops a distributed sweep across many
  // emails, and a per-code attempt counter (below) burns the code after a few
  // misses so a single 10-minute window can't be swept. Without this, a code
  // that stays valid for 10 minutes is ~1e6 guesses with no ceiling.
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  if (await isRateLimited(env, `verify:ip:${ip}`, { limit: 20, windowSeconds: 900 })) {
    return json({ error: 'Too many attempts. Try again in a few minutes.' }, { status: 429, env });
  }

  const attemptsKey = `otp:attempts:${normalizedEmail}`;
  const stored = await env.SESSIONS.get(`otp:${normalizedEmail}`);
  if (!stored || stored !== otp) {
    // Count misses against the live code and burn it after 5, so the window
    // can't be brute-forced. Re-requesting a fresh code is itself capped in
    // magicLink (3 per email / 15 min), so the total guess budget stays tiny.
    const attempts = Number((await env.SESSIONS.get(attemptsKey)) || '0') + 1;
    if (stored && attempts >= 5) {
      await env.SESSIONS.delete(`otp:${normalizedEmail}`);
      await env.SESSIONS.delete(attemptsKey);
    } else {
      await env.SESSIONS.put(attemptsKey, String(attempts), { expirationTtl: 600 });
    }
    return json({ error: 'Invalid or expired code' }, { status: 401, env });
  }
  await env.SESSIONS.delete(`otp:${normalizedEmail}`);
  await env.SESSIONS.delete(attemptsKey);

  // Upsert the user. Signing in creates the account if it's their first time —
  // the same account they'll subscribe on, and what carries their status across
  // devices.
  let user = await selectOne(env, 'users', { email: normalizedEmail });
  if (!user) {
    user = await insertRow(env, 'users', {
      email: normalizedEmail,
      subscription_status: 'free',
    });
  }

  const token = await sign({ sub: user.id, email: user.email }, env.JWT_SECRET, {
    expiresInSeconds: 60 * 60 * 24 * 30, // 30 days
  });

  return json({ token, user: publicUser(user) }, { env });
}

export async function me(request, env) {
  const claims = await authedUser(request, env);
  if (!claims) return json({ error: 'Unauthorized' }, { status: 401, env });

  const user = await selectOne(env, 'users', { id: claims.sub });
  if (!user) return json({ error: 'Not found' }, { status: 404, env });

  return json(publicUser(user), { env });
}

export async function deleteAccount(request, env) {
  const claims = await authedUser(request, env);
  if (!claims) return json({ error: 'Unauthorized' }, { status: 401, env });

  const user = await selectOne(env, 'users', { id: claims.sub });

  // Cancel Stripe subscription if any (best effort — local data still gets
  // deleted below even if this fails, since the account deletion itself
  // shouldn't hang on Stripe). Logged rather than swallowed: once the D1 rows
  // are gone below, this log line is the only trace left to reconcile a
  // subscription that kept billing after the account was deleted.
  if (user?.stripe_customer_id) {
    try {
      await cancelStripeSubscriptions(env, user.stripe_customer_id);
    } catch (err) {
      console.error(
        `[auth.deleteAccount] Failed to cancel Stripe subscriptions for customer ${user.stripe_customer_id} (user ${claims.sub}): ${err.stack || err}`
      );
    }
  }

  // Delete all associated data. (The schema's ON DELETE CASCADE could do this in
  // one delete; explicit here so it's obvious what's removed.)
  await deleteRows(env, 'listening_sessions', { user_id: claims.sub });
  await deleteRows(env, 'subscriptions', { user_id: claims.sub });
  await deleteRows(env, 'referrals', { referrer_id: claims.sub });
  await deleteRows(env, 'referrals', { invitee_id: claims.sub });
  await deleteRows(env, 'email_subscribers', { email: claims.email });
  await deleteRows(env, 'users', { id: claims.sub });

  return json({ ok: true }, { env });
}

function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    subscription_status: user.subscription_status || 'free', // raw Stripe status
    premium_until: user.premium_until || null,
    is_premium: isPremium(user),
  };
}

async function cancelStripeSubscriptions(env, customerId) {
  const res = await fetch(
    `https://api.stripe.com/v1/subscriptions?customer=${customerId}&status=active`,
    { headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}` } }
  );
  const data = await res.json();
  await Promise.all(
    (data.data || []).map((sub) =>
      fetch(`https://api.stripe.com/v1/subscriptions/${sub.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}` },
      })
    )
  );
}
