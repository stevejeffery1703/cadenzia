// Cloudflare Worker entry point.
// - Serves the built React app via the ASSETS binding (configured in wrangler).
// - Handles the JSON API under /api/*.
// - Streams audio under /audio/* from R2 (public read).
//
// Secrets are read from `env` (set with `wrangler secret put`). Never hardcoded.

import { handlePreflight, json } from './middleware/cors.js';
import * as auth from './routes/auth.js';
import * as subscription from './routes/subscription.js';
import * as share from './routes/share.js';
import * as download from './routes/download.js';
import * as email from './routes/email.js';
import * as plays from './routes/plays.js';
import * as sessions from './routes/sessions.js';

// Stripe webhook needs the raw body, so it's matched before JSON parsing.
const ROUTES = {
  'POST /api/auth/magic-link': auth.magicLink,
  'POST /api/auth/verify': auth.verify,
  'GET /api/auth/me': auth.me,
  'POST /api/auth/delete': auth.deleteAccount,

  'POST /api/subscription/checkout': subscription.checkout,
  'POST /api/subscription/portal': subscription.portal,
  'POST /api/subscription/webhook': subscription.webhook,

  'POST /api/share/token': share.createToken,
  'POST /api/share/redeem': share.redeem,

  'POST /api/plays/increment': plays.increment,
  'GET /api/plays/count': plays.count,

  'POST /api/sessions/record': sessions.record,

  'POST /api/download/link': download.link,

  'POST /api/email/subscribe': email.subscribe,
  'GET /api/email/unsubscribe': email.unsubscribe,
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') return handlePreflight(env);

    // Audio streaming from R2 (public read; no auth needed for free streaming).
    if (url.pathname.startsWith('/audio/')) {
      return serveAudio(url, env);
    }

    // API routing.
    if (url.pathname.startsWith('/api/')) {
      const key = `${request.method} ${url.pathname}`;
      const handler = ROUTES[key];
      if (!handler) return json({ error: 'Not found' }, { status: 404, env });
      try {
        return await handler(request, env, ctx);
      } catch (err) {
        // Surfaces in `wrangler tail` / the Cloudflare dashboard's Worker Logs —
        // the only observability we have without a third-party service.
        console.error(`[${key}] ${err.stack || err}`);
        return json({ error: err.message || 'Server error' }, { status: 500, env });
      }
    }

    // Everything else → static assets (SPA fallback handled by wrangler config).
    return env.ASSETS.fetch(request);
  },
};

async function serveAudio(url, env) {
  const objectKey = decodeURIComponent(url.pathname.replace('/audio/', ''));
  const object = await env.AUDIO_BUCKET.get(objectKey);
  if (!object) return new Response('Not found', { status: 404 });

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  headers.set('Cache-Control', 'public, max-age=3600');
  headers.set('Accept-Ranges', 'bytes');
  return new Response(object.body, { headers });
}
