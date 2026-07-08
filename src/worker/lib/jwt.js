// Minimal HS256 JWT sign/verify using the Web Crypto API (available in Workers).
// Used for session tokens plus the scoped stream-cookie and unsubscribe tokens.
// JWT_SECRET is a Worker secret.

function b64url(bytes) {
  let bin = '';
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  for (const b of arr) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlToBytes(str) {
  const pad = str.length % 4 ? '='.repeat(4 - (str.length % 4)) : '';
  const bin = atob(str.replace(/-/g, '+').replace(/_/g, '/') + pad);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

const enc = new TextEncoder();

async function key(secret) {
  return crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

export async function sign(payload, secret, { expiresInSeconds = 3600 } = {}) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const body = { ...payload, iat: now, exp: now + expiresInSeconds };
  const head = b64url(enc.encode(JSON.stringify(header)));
  const data = b64url(enc.encode(JSON.stringify(body)));
  const k = await key(secret);
  const sig = await crypto.subtle.sign('HMAC', k, enc.encode(`${head}.${data}`));
  return `${head}.${data}.${b64url(sig)}`;
}

export async function verify(token, secret) {
  const [head, data, sig] = (token || '').split('.');
  if (!head || !data || !sig) return null;
  const k = await key(secret);
  const valid = await crypto.subtle.verify(
    'HMAC',
    k,
    b64urlToBytes(sig),
    enc.encode(`${head}.${data}`)
  );
  if (!valid) return null;
  const payload = JSON.parse(new TextDecoder().decode(b64urlToBytes(data)));
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
  return payload;
}

// Extracts and verifies the bearer token from a request. Returns payload or null.
// Only session tokens authenticate a user: those are minted without a `kind`,
// whereas the other signed tokens carry one (`kind: 'stream'` for the audio
// cookie, `kind: 'unsubscribe'` for email links). Rejecting any token with a
// `kind` here keeps a scoped token from being replayed as a session credential.
export async function authedUser(request, env) {
  const header = request.headers.get('Authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return null;
  const payload = await verify(token, env.JWT_SECRET);
  if (!payload || payload.kind) return null;
  return payload;
}
