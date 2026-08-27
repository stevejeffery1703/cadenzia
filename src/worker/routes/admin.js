// Private dashboard numbers, for the owner only.
//   GET /api/admin/stats → aggregate counts, or 404 to anyone else
//
// These are counts of rows we already store — no new tracking, no per-visitor
// records, nothing personal, and nothing that would need a cookie banner. It
// deliberately reports what only the database knows (plays, accounts,
// subscribers, mailing list); site traffic belongs in Cloudflare Analytics,
// which already measures it properly and filters bots.
//
// Gated on ADMIN_EMAIL (a Worker secret). If it isn't set, the route stays shut
// — it can never fall open to everyone. Non-owners get 404 rather than 403, so
// the endpoint's existence isn't advertised.

import { json } from '../middleware/cors.js';
import { authedUser } from '../lib/jwt.js';
import { selectOne, getPlayCount } from '../lib/db.js';

const notFound = (env) => json({ error: 'Not found' }, { status: 404, env });

async function scalar(env, sql) {
  try {
    const row = await env.DB.prepare(sql).first();
    return row ? Number(Object.values(row)[0]) || 0 : 0;
  } catch {
    // A missing legacy table shouldn't take the whole panel down.
    return null;
  }
}

export async function stats(request, env) {
  const admin = (env.ADMIN_EMAIL || '').trim().toLowerCase();
  if (!admin) return notFound(env);

  const claims = await authedUser(request, env);
  if (!claims) return notFound(env);

  const user = await selectOne(env, 'users', { id: claims.sub });
  if (!user || (user.email || '').trim().toLowerCase() !== admin) return notFound(env);

  const [plays, users, subscribers, mailing] = await Promise.all([
    getPlayCount(env).catch(() => null),
    scalar(env, 'SELECT COUNT(*) FROM users'),
    scalar(env, "SELECT COUNT(*) FROM users WHERE subscription_status = 'active'"),
    scalar(env, 'SELECT COUNT(*) FROM email_subscribers WHERE unsubscribed = 0'),
  ]);

  return json({ plays, users, subscribers, mailing }, { env });
}
