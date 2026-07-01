// Play counter — the only social proof we have at launch, and an honest one.
//   POST /api/plays/increment → atomically bump the global counter (on track end)
//   GET  /api/plays/count     → read the current total
//
// Stored in Supabase as a single-row counter, incremented via an atomic RPC so
// concurrent plays can't clobber each other.

import { json } from '../middleware/cors.js';
import { select, rpc } from '../lib/supabase.js';

export async function increment(request, env) {
  const data = await rpc(env, 'increment_plays');
  const count = typeof data === 'number' ? data : data?.count ?? null;
  return json({ count }, { env });
}

export async function count(request, env) {
  const rows = await select(env, 'play_counter', 'id=eq.1&select=count');
  return json({ count: rows[0]?.count ?? 0 }, { env });
}
