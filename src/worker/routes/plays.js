// Play counter — the only social proof we have at launch, and an honest one.
//   POST /api/plays/increment → atomically bump the global counter (on track end)
//   GET  /api/plays/count     → read the current total
//
// Stored in D1 as a single-row counter, incremented atomically (UPDATE ...
// RETURNING) so concurrent plays can't clobber each other.

import { json } from '../middleware/cors.js';
import { getPlayCount, incrementPlays } from '../lib/db.js';
import { isRateLimited } from '../lib/rateLimit.js';

export async function increment(request, env) {
  // The counter is public and unauthenticated by design (anonymous plays count
  // too), so guard it against trivial scripted inflation with a light per-IP cap.
  // A real client only completes a track every 20+ minutes, so no human trips
  // this — a loop does. On a hit, return the current total without bumping rather
  // than erroring, so an honest client that happens to cap still renders a number.
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  if (await isRateLimited(env, `plays:ip:${ip}`, { limit: 20, windowSeconds: 60 })) {
    return json({ count: await getPlayCount(env) }, { env });
  }
  const count = await incrementPlays(env);
  return json({ count }, { env });
}

export async function count(request, env) {
  const count = await getPlayCount(env);
  return json({ count }, { env });
}
