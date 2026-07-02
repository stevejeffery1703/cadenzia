// Fixed-window rate limiter backed by the SESSIONS KV namespace. Not
// atomic — a burst of concurrent requests can slip a couple of extra hits
// through — but that's fine for spam/abuse mitigation, not a security boundary.
export async function isRateLimited(env, key, { limit, windowSeconds }) {
  const bucket = Math.floor(Date.now() / 1000 / windowSeconds);
  const bucketKey = `ratelimit:${key}:${bucket}`;

  const current = Number((await env.SESSIONS.get(bucketKey)) || '0');
  if (current >= limit) return true;

  await env.SESSIONS.put(bucketKey, String(current + 1), { expirationTtl: windowSeconds });
  return false;
}
