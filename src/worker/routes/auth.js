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
import { selectOne, insertRow, deleteRows, getListeningStats } from '../lib/db.js';
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
  const stored = await env.SESSIONS.get(`otp:${normalizedEmail}`);
  if (!stored || stored !== otp) {
    return json({ error: 'Invalid or expired code' }, { status: 401, env });
  }
  await env.SESSIONS.delete(`otp:${normalizedEmail}`);

  // Upsert the user.
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

  // Only subscribers see the stats panel, so skip the query otherwise.
  const stats = user.subscription_status === 'active' ? await getListeningStats(env, user.id) : null;
  return json(publicUser(user, stats), { env });
}

export async function deleteAccount(request, env) {
  const claims = await authedUser(request, env);
  if (!claims) return json({ error: 'Unauthorized' }, { status: 401, env });

  const user = await selectOne(env, 'users', { id: claims.sub });

  // Cancel Stripe subscription if any (best effort).
  if (user?.stripe_customer_id) {
    try {
      await cancelStripeSubscriptions(env, user.stripe_customer_id);
    } catch {
      /* don't block deletion on Stripe errors */
    }
  }

  // Delete all associated data. (The schema's ON DELETE CASCADE could do this in
  // one delete; explicit here so it's obvious what's removed.)
  await deleteRows(env, 'listening_sessions', { user_id: claims.sub });
  await deleteRows(env, 'subscriptions', { user_id: claims.sub });
  await deleteRows(env, 'email_subscribers', { email: claims.email });
  await deleteRows(env, 'users', { id: claims.sub });

  return json({ ok: true }, { env });
}

function publicUser(user, stats = null) {
  return {
    id: user.id,
    email: user.email,
    subscription_status: user.subscription_status || 'free',
    stats,
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
