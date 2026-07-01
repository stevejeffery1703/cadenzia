// Play counter — the only social proof we have at launch, and an honest one.
//   POST /api/plays/increment → atomically bump the global counter (on track end)
//   GET  /api/plays/count     → read the current total
//
// Stored in D1 as a single-row counter, incremented atomically (UPDATE ...
// RETURNING) so concurrent plays can't clobber each other.

import { json } from '../middleware/cors.js';
import { getPlayCount, incrementPlays } from '../lib/db.js';

export async function increment(request, env) {
  const count = await incrementPlays(env);
  return json({ count }, { env });
}

export async function count(request, env) {
  const count = await getPlayCount(env);
  return json({ count }, { env });
}
