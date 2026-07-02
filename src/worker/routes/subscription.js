// Stripe subscription lifecycle.
//   POST /api/subscription/checkout → creates a Checkout Session, returns hosted URL
//   POST /api/subscription/portal   → creates a Billing Portal session
//   POST /api/subscription/webhook  → Stripe events → update D1
//
// We never collect card details — Stripe's hosted Checkout does. $2.99/month
// recurring price is STRIPE_PRICE_ID.

import { json } from '../middleware/cors.js';
import { authedUser } from '../lib/jwt.js';
import { selectOne, updateRows, insertRow } from '../lib/db.js';

// Stripe wants application/x-www-form-urlencoded; this flattens nested params.
function form(params, prefix = '') {
  const out = [];
  for (const [k, v] of Object.entries(params)) {
    const key = prefix ? `${prefix}[${k}]` : k;
    if (v && typeof v === 'object') out.push(form(v, key));
    else out.push(`${encodeURIComponent(key)}=${encodeURIComponent(v)}`);
  }
  return out.join('&');
}

async function stripe(env, path, params) {
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params ? form(params) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'Stripe error');
  return data;
}

export async function checkout(request, env) {
  const claims = await authedUser(request, env);
  if (!claims) return json({ error: 'Sign in first' }, { status: 401, env });

  const user = await selectOne(env, 'users', { id: claims.sub });

  // Reuse or create the Stripe customer.
  let customerId = user?.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe(env, 'customers', { email: claims.email });
    customerId = customer.id;
    await updateRows(env, 'users', { id: claims.sub }, { stripe_customer_id: customerId });
  }

  const session = await stripe(env, 'checkout/sessions', {
    mode: 'subscription',
    customer: customerId,
    'line_items': { 0: { price: env.STRIPE_PRICE_ID, quantity: 1 } },
    success_url: `${env.APP_URL}/account?checkout=success`,
    cancel_url: `${env.APP_URL}/app`,
    'client_reference_id': claims.sub,
  });

  return json({ url: session.url }, { env });
}

export async function portal(request, env) {
  const claims = await authedUser(request, env);
  if (!claims) return json({ error: 'Sign in first' }, { status: 401, env });

  const user = await selectOne(env, 'users', { id: claims.sub });
  const customerId = user?.stripe_customer_id;
  if (!customerId) return json({ error: 'No subscription' }, { status: 400, env });

  const session = await stripe(env, 'billing_portal/sessions', {
    customer: customerId,
    return_url: `${env.APP_URL}/account`,
  });
  return json({ url: session.url }, { env });
}

// Stripe webhook. Verifies the signature, then mirrors subscription state into
// D1 so the app can gate audio by `subscription_status`.
export async function webhook(request, env) {
  const sig = request.headers.get('stripe-signature');
  const body = await request.text();

  const valid = await verifyStripeSignature(body, sig, env.STRIPE_WEBHOOK_SECRET);
  if (!valid) return json({ error: 'Invalid signature' }, { status: 400, env });

  const event = JSON.parse(body);
  const obj = event.data.object;

  switch (event.type) {
    case 'checkout.session.completed':
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const customerId = obj.customer;
      const status = obj.status === 'active' || obj.status === 'trialing' ? 'active' : 'free';
      const periodEnd = obj.current_period_end
        ? new Date(obj.current_period_end * 1000).toISOString()
        : null;
      await syncSubscription(env, customerId, obj.id || null, status, periodEnd);
      break;
    }
    case 'customer.subscription.deleted': {
      await syncSubscription(env, obj.customer, obj.id, 'free', null);
      break;
    }
    default:
      break;
  }

  return json({ received: true }, { env });
}

async function syncSubscription(env, customerId, subscriptionId, status, periodEnd) {
  const user = await selectOne(env, 'users', { stripe_customer_id: customerId }, ['id']);
  if (!user) return;

  await updateRows(env, 'users', { id: user.id }, { subscription_status: status });

  if (subscriptionId) {
    const existing = await selectOne(
      env,
      'subscriptions',
      { stripe_subscription_id: subscriptionId },
      ['id']
    );
    const patch = {
      user_id: user.id,
      stripe_subscription_id: subscriptionId,
      status,
      current_period_end: periodEnd,
    };
    if (existing) {
      await updateRows(env, 'subscriptions', { id: existing.id }, patch);
    } else {
      await insertRow(env, 'subscriptions', patch);
    }
  }
}

// Verifies Stripe's HMAC-SHA256 signature header (t=...,v1=...).
async function verifyStripeSignature(payload, header, secret) {
  if (!header || !secret) return false;
  const parts = Object.fromEntries(header.split(',').map((p) => p.split('=')));
  if (!parts.t || !parts.v1) return false;

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(`${parts.t}.${payload}`));
  const hex = [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
  // Reject replays older than 5 minutes.
  if (Math.abs(Date.now() / 1000 - Number(parts.t)) > 300) return false;
  return hex === parts.v1;
}
