// Per-user listening history — powers the subscriber stats panel on /account.
// Privacy-first: anonymous free listening is never recorded, only signed-in
// users get a row, and only on natural track completion.

import { json } from '../middleware/cors.js';
import { authedUser } from '../lib/jwt.js';
import { insertRow } from '../lib/db.js';

export async function record(request, env) {
  const claims = await authedUser(request, env);
  if (!claims) return json({ ok: true }, { env }); // not signed in — nothing to record

  const { trackId, trackName, durationSeconds } = await request.json();
  const seconds = Number(durationSeconds);
  if (!trackId || !Number.isFinite(seconds) || seconds <= 0) {
    return json({ error: 'trackId and durationSeconds required' }, { status: 400, env });
  }

  await insertRow(env, 'listening_sessions', {
    user_id: claims.sub,
    track_id: trackId,
    track_name: trackName || null,
    // Clamp to a sane ceiling — a single completion is at most tens of minutes,
    // so this bounds any client attempt to inflate the private stats panel.
    duration_seconds: Math.min(Math.round(seconds), 6 * 60 * 60),
  });

  return json({ ok: true }, { env });
}
