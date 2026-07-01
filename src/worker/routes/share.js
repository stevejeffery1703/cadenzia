// Share tokens. No account required — tied to an anonymous device id.
//   POST /api/share/token  → mint a short-lived signed token, store in KV
//   POST /api/share/redeem → mark redeemed, grant a 24h unlock token
//
// The viral loop is intentionally unbounded (no daily cap on shares). Trust-based.

import { json } from '../middleware/cors.js';
import { sign, verify } from '../lib/jwt.js';

export async function createToken(request, env) {
  const { device, platform } = await request.json();
  if (!device) return json({ error: 'device required' }, { status: 400, env });

  const token = await sign({ device, platform, kind: 'share' }, env.JWT_SECRET, {
    expiresInSeconds: 3600, // user has an hour to post + redeem
  });

  // Record the pending share (10 min more than token life for safety).
  await env.SESSIONS.put(`share:${token}`, JSON.stringify({ device, platform, redeemed: false }), {
    expirationTtl: 4200,
  });

  return json({ token }, { env });
}

export async function redeem(request, env) {
  const { token, device } = await request.json();
  const claims = await verify(token, env.JWT_SECRET);
  if (!claims || claims.kind !== 'share' || claims.device !== device) {
    return json({ error: 'Invalid share token' }, { status: 400, env });
  }

  // Grant a 24h unlock for this device.
  const until = Date.now() + 24 * 60 * 60 * 1000;
  await env.SESSIONS.put(`unlock:${device}`, String(until), {
    expirationTtl: 24 * 60 * 60,
  });

  // Mark the share redeemed (for milestone counting later — Phase 2).
  await env.SESSIONS.put(`share:${token}`, JSON.stringify({ device, redeemed: true }), {
    expirationTtl: 4200,
  });

  return json({ ok: true, unlockUntil: until }, { env });
}

// Helper other routes can call to check a device's unlock status.
export async function isUnlocked(env, device) {
  const raw = await env.SESSIONS.get(`unlock:${device}`);
  return raw && Number(raw) > Date.now();
}
