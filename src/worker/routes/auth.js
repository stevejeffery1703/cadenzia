// Auth: passwordless magic-link style, kept deliberately simple.
//   POST /api/auth/magic-link  → emails a 6-digit code (via Resend), stores it in KV
//   POST /api/auth/verify      → checks code, upserts user, returns our session JWT
//   GET  /api/auth/me          → returns the current user + subscription status
//   POST /api/auth/delete      → deletes user + all associated data
//
// For production you may prefer Supabase Auth's own magic links; this keeps the
// MVP self-contained with one fewer moving part.

import { json } from '../middleware/cors.js';
import { sign, authedUser } from '../lib/jwt.js';
import { select, insert, update, remove } from '../lib/supabase.js';
import { sendEmail } from './email.js';

const sixDigits = () => String(Math.floor(100000 + Math.random() * 900000));

export async function magicLink(request, env) {
  const { email } = await request.json();
  if (!email) return json({ error: 'Email required' }, { status: 400, env });

  const code = sixDigits();
  // Store the code for 10 minutes, keyed by email.
  await env.SESSIONS.put(`otp:${email.toLowerCase()}`, code, { expirationTtl: 600 });

  await sendEmail(env, {
    to: email,
    subject: `Your sign-in code`,
    text: `Your sign-in code is ${code}. It expires in 10 minutes.`,
  });

  return json({ ok: true }, { env });
}

export async function verify(request, env) {
  const { email, otp } = await request.json();
  if (!email || !otp) return json({ error: 'Email and code required' }, { status: 400, env });

  const stored = await env.SESSIONS.get(`otp:${email.toLowerCase()}`);
  if (!stored || stored !== otp) {
    return json({ error: 'Invalid or expired code' }, { status: 401, env });
  }
  await env.SESSIONS.delete(`otp:${email.toLowerCase()}`);

  // Upsert the user.
  let users = await select(env, 'users', `email=eq.${encodeURIComponent(email)}&select=*`);
  let user = users[0];
  if (!user) {
    const created = await insert(env, 'users', {
      email: email.toLowerCase(),
      subscription_status: 'free',
    });
    user = created[0];
  }

  const token = await sign({ sub: user.id, email: user.email }, env.JWT_SECRET, {
    expiresInSeconds: 60 * 60 * 24 * 30, // 30 days
  });

  return json({ token, user: publicUser(user) }, { env });
}

export async function me(request, env) {
  const claims = await authedUser(request, env);
  if (!claims) return json({ error: 'Unauthorized' }, { status: 401, env });

  const users = await select(env, 'users', `id=eq.${claims.sub}&select=*`);
  const user = users[0];
  if (!user) return json({ error: 'Not found' }, { status: 404, env });
  return json(publicUser(user), { env });
}

export async function deleteAccount(request, env) {
  const claims = await authedUser(request, env);
  if (!claims) return json({ error: 'Unauthorized' }, { status: 401, env });

  const users = await select(env, 'users', `id=eq.${claims.sub}&select=*`);
  const user = users[0];

  // Cancel Stripe subscription if any (best effort).
  if (user?.stripe_customer_id) {
    try {
      await cancelStripeSubscriptions(env, user.stripe_customer_id);
    } catch {
      /* don't block deletion on Stripe errors */
    }
  }

  // Delete all associated data. (With ON DELETE CASCADE in the schema this could
  // be a single delete; explicit here so it's obvious what's removed.)
  await remove(env, 'listening_sessions', `user_id=eq.${claims.sub}`);
  await remove(env, 'subscriptions', `user_id=eq.${claims.sub}`);
  await remove(env, 'email_subscribers', `email=eq.${encodeURIComponent(claims.email)}`);
  await remove(env, 'users', `id=eq.${claims.sub}`);

  return json({ ok: true }, { env });
}

function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    subscription_status: user.subscription_status || 'free',
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
