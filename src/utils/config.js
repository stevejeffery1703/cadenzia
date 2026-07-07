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

// Free tier: an hour of open listening every day, pooled across sessions and
// tracks. When the day's hour is used up, one calm choice — subscribe, or
// continue free for the rest of today. Resets at local midnight. Accounting is
// first-party functional storage (localStorage), not tracking.
export const FREE_DAILY_MINUTES = 60;

// The daily gate fades the music out rather than cutting it. On devices that
// honour programmatic volume (desktop/Android) this is a real fade; on iOS,
// where volume is fixed, the player detects that and stops cleanly instead —
// harmless, since the looping categories are transient-free washes.
export const GATE_FADE_SECONDS = 6;

// Free-trial lengths (enforced server-side; these are for UI copy). Every new
// account gets a first week of Premium; a referred signup gets two.
export const INTRO_TRIAL_DAYS = 7;
export const REFERRED_TRIAL_DAYS = 14;

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
