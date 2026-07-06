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

// Free tier: unlimited listening for the first hour of any session. After that,
// one share (or a subscription) continues the session. This is per-session — it
// resets whenever a new session begins, not on a daily clock.
export const FREE_SESSION_MINUTES = 60;

// Subscriber downloads remain playable offline for this many days.
export const DOWNLOAD_EXPIRY_DAYS = 30;

// The play counter is honest social proof — but a tiny number reads as the
// opposite. Hold the element back until total plays clear this threshold.
export const PLAY_COUNTER_THRESHOLD = 500;

// Playback feel (seconds). Fades are never abrupt.
export const FADE_IN_SECONDS = 2;
export const CROSSFADE_SECONDS = 3;

// Where audio is served from. In production this is the R2/CDN origin; the
// Worker can also proxy under /audio/. Track files resolve to `${AUDIO_BASE}/<id>.mp3`.
export const AUDIO_BASE = import.meta.env.VITE_AUDIO_BASE || '/audio';
