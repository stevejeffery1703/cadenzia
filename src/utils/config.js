// Single source of truth for app-wide constants.
// Renaming the product = change APP_NAME here and in the PWA manifest + index.html title.

export const APP_NAME = import.meta.env.VITE_APP_NAME || 'Cadenzia';
export const APP_URL = import.meta.env.VITE_APP_URL || 'https://cadenzia.app';

export const PRICE = {
  amount: 4.99,
  currency: 'USD',
  label: '$4.99/month',
  short: '$4.99/mo',
};

// ⚠️ PRE-LAUNCH PAYMENTS KILL SWITCH — off by default, on purpose.
//
// Cadenzia is still in development (the piano catalogue is being recorded), so
// nothing may take money yet. This flag is COSMETIC: it hides the subscribe
// CTAs and shows PRELAUNCH_NOTE instead. The real guard is server-side —
// POST /api/subscription/checkout returns 503 while the Worker's
// PAYMENTS_ENABLED var is off (see wrangler.jsonc + worker/routes/subscription.js).
// Never rely on this flag alone.
//
// TO GO LIVE both must be turned on: build with VITE_PAYMENTS_ENABLED=true AND
// set "PAYMENTS_ENABLED": "true" in wrangler.jsonc.
// Work through docs/go-live-checklist.md first — the Stripe account was
// replaced and its setup must be redone and re-verified before either is flipped.
export const PAYMENTS_ENABLED = import.meta.env.VITE_PAYMENTS_ENABLED === 'true';

// Shown wherever a subscribe CTA would be, while payments are off. Deliberately
// quiet and unapologetic — the product is being made, not broken.
export const PRELAUNCH_NOTE = 'In development — come back soon.';

// Free tier: a collection of pieces that plays uninterrupted, forever, with no
// account and no clock. There is deliberately no time limit and nothing that
// stops the music — the paid tier is *more music* (the full library, plus every
// new piece as it's recorded), never *more minutes*. Which pieces are free is
// declared per-track in utils/tracks.js.

// The play counter is honest social proof — but a tiny number reads as the
// opposite. Hold the element back until total plays clear this threshold.
export const PLAY_COUNTER_THRESHOLD = 500;

// Playback feel (seconds). Fades are never abrupt.
export const FADE_IN_SECONDS = 2;
export const CROSSFADE_SECONDS = 3;

// Where audio is served from. In production this is the R2/CDN origin; the
// Worker can also proxy under /audio/. Track files resolve to `${AUDIO_BASE}/<id>.mp3`.
export const AUDIO_BASE = import.meta.env.VITE_AUDIO_BASE || '/audio';
