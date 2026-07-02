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
import { PAGE_META } from '../utils/pageMeta.js';

// The app's real client-side routes — used to tell a genuine soft-404 apart
// from a valid SPA route when both get served the same index.html shell.
// Also what HTMLRewriter below uses to give each route's raw HTML (what
// non-JS crawlers and social-media unfurlers see) its own title/description,
// rather than every route sharing index.html's static defaults.
const KNOWN_ROUTES = new Set(Object.keys(PAGE_META));

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
        // Full detail surfaces in `wrangler tail` / the Cloudflare dashboard's
        // Worker Logs — the only observability we have without a third-party
        // service. The client only ever gets a generic message: routes that
        // want to tell the caller something specific return their own 4xx
        // json() response directly rather than throwing, so anything landing
        // here is an unexpected failure (e.g. a raw Stripe/Resend API error)
        // that shouldn't leak internal detail to the response body.
        console.error(`[${key}] ${err.stack || err}`);
        return json({ error: 'Server error' }, { status: 500, env });
      }
    }

    // Everything else → static assets (SPA fallback handled by wrangler config).
    return serveStaticOrNotFound(request, url, env);
  },
};

// Cloudflare's SPA fallback (wrangler.jsonc's `not_found_handling`) serves
// index.html with a 200 for ANY unmatched path — a soft 404 that wastes crawl
// budget and can get garbage URLs indexed. If what comes back is the HTML
// shell for a path that isn't one of our real routes, report a genuine 404
// while still returning the shell, so the client router still renders its
// own NotFound page for the human visitor. For a real route, rewrite the
// shell's meta tags to that page's own title/description — the client-side
// useDocumentHead hook does the same thing after React mounts, but crawlers
// that don't execute JS (most social-media link unfurlers) only ever see
// this server-rendered version.
async function serveStaticOrNotFound(request, url, env) {
  const response = await env.ASSETS.fetch(request);
  const isHtmlShell = (response.headers.get('content-type') || '').includes('text/html');
  if (!isHtmlShell) return response;

  if (!KNOWN_ROUTES.has(url.pathname)) {
    return new Response(response.body, { status: 404, headers: response.headers });
  }
  return rewriteMetaForPath(response, url.pathname);
}

function rewriteMetaForPath(response, path) {
  const meta = PAGE_META[path];
  if (!meta) return response;

  const canonicalUrl = `https://cadenzia.app${path}`;
  return new HTMLRewriter()
    .on('title', { element: (el) => el.setInnerContent(meta.title) })
    .on('meta[name="description"]', { element: (el) => el.setAttribute('content', meta.description) })
    .on('meta[property="og:title"]', { element: (el) => el.setAttribute('content', meta.title) })
    .on('meta[property="og:description"]', { element: (el) => el.setAttribute('content', meta.description) })
    .on('meta[property="og:url"]', { element: (el) => el.setAttribute('content', canonicalUrl) })
    .on('meta[name="twitter:title"]', { element: (el) => el.setAttribute('content', meta.title) })
    .on('meta[name="twitter:description"]', { element: (el) => el.setAttribute('content', meta.description) })
    .transform(response);
}

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
