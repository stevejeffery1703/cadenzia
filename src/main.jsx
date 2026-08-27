import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/global.css';

// Catch `beforeinstallprompt` here, before React mounts. The browser fires it
// once, early, and often before any component has had a chance to subscribe —
// so it's stashed on `window` for useInstallPrompt to pick up whenever the
// player or account page happens to render. preventDefault() suppresses the
// browser's own install banner: we offer it in our own words, in our own place,
// or not at all.
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  window.__cadInstallEvent = e;
  window.dispatchEvent(new Event('cad:installable'));
});

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register the service worker for PWA install + background playback support.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').catch(() => {
      /* non-fatal — app still works without it */
    });
  });
}
