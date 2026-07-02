// Cadenzia service worker.
// Goals: installable PWA + offline shell. Audio streams from R2 and is
// intentionally NOT cached here (large files; paid downloads handled separately).
// Background playback is driven by the <audio> element + Media Session API in
// the page, which the OS keeps alive while audio is playing.

const CACHE = 'cadenzia-shell-v1';
const SHELL = ['/', '/app', '/manifest.json', '/icons/icon-192.png', '/icons/icon-512.png'];

self.addEventListener('install', (event) => {
  // Per-asset, so one broken shell URL can't fail the whole install forever —
  // c.addAll() is all-or-nothing and a single miss would leave the SW stuck.
  event.waitUntil(
    caches
      .open(CACHE)
      .then((c) => Promise.all(SHELL.map((url) => c.add(url).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Never intercept audio streams or API calls — always go to network.
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/audio/') || request.destination === 'audio') {
    return;
  }

  // Navigation requests: network-first, fall back to cached shell when offline.
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match('/')));
    return;
  }

  // Static assets: cache-first.
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request))
  );
});
