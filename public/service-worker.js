// Cadenzia service worker.
// Goals: installable PWA + offline shell. Audio streams from R2 and is
// intentionally NOT cached here (large files, and each request is cookie-gated).
// Background playback is driven by the <audio> element + Media Session API in
// the page, which the OS keeps alive while audio is playing.

const CACHE = 'cadenzia-shell-v2';
const PRECACHE = ['/', '/manifest.json', '/icons/icon-192.png', '/icons/icon-512.png'];

self.addEventListener('install', (event) => {
  // Per-asset, so one broken shell URL can't fail the whole install forever —
  // addAll() is all-or-nothing and a single miss would leave the SW stuck.
  event.waitUntil(
    caches
      .open(CACHE)
      .then((c) => Promise.all(PRECACHE.map((url) => c.add(url).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Never intercept audio streams or API calls — always go to network.
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/audio/') ||
    request.destination === 'audio'
  ) {
    return;
  }

  // Navigations: network-first, and refresh the cached shell on every success so
  // an offline visit always falls back to the *latest* HTML — never a stale shell
  // pointing at asset hashes that a deploy has since purged (the bug in v1, where
  // the SW's own bytes never changed so `install` never re-ran to update '/').
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put('/', copy));
          return res;
        })
        .catch(() => caches.match('/'))
    );
    return;
  }

  // Static assets (content-hashed, immutable): stale-while-revalidate. Serve from
  // cache instantly when present, and populate/refresh in the background — so the
  // hashed bundles referenced by the freshest shell get cached as they load, and
  // the next offline visit has a matching, working set. Same-origin only, so we
  // never cache opaque cross-origin responses (e.g. fonts).
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((res) => {
          if (res && res.ok && url.origin === self.location.origin) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(request, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
