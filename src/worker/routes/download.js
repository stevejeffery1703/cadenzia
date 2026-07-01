// Signed download links for paid subscribers.
//   POST /api/download/link { trackId } → short-lived signed URL to the R2 object
//
// No DRM — trust-based. Links are valid for 24 hours. Only active subscribers
// may request them.

import { json } from '../middleware/cors.js';
import { authedUser, sign } from '../lib/jwt.js';
import { select } from '../lib/supabase.js';

export async function link(request, env) {
  const claims = await authedUser(request, env);
  if (!claims) return json({ error: 'Sign in first' }, { status: 401, env });

  const users = await select(env, 'users', `id=eq.${claims.sub}&select=subscription_status`);
  if (users[0]?.subscription_status !== 'active') {
    return json({ error: 'Downloads are a subscriber benefit' }, { status: 403, env });
  }

  const { trackId } = await request.json();
  if (!trackId) return json({ error: 'trackId required' }, { status: 400, env });

  // Sign a token the /audio/download endpoint can verify. (Alternatively, use
  // R2 presigned URLs via the S3 API — this keeps everything inside the Worker.)
  const token = await sign({ trackId, kind: 'download', sub: claims.sub }, env.JWT_SECRET, {
    expiresInSeconds: 24 * 60 * 60,
  });

  const url = `${env.APP_URL}/audio/${trackId}.mp3?dl=${token}`;
  return json({ url, expiresIn: 86400 }, { env });
}
