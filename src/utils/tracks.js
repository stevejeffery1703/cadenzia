// The library. Single source of truth for categories and tracks.
//
// Every piece here is a real acoustic piano performance, played and recorded by
// hand — not generated. That is the product, and it shapes this file in three
// ways: pieces are through-composed (they end rather than loop), their lengths
// vary because performances do, and the library grows a piece at a time.
//
// Audio files resolve against AUDIO_BASE. Track artwork is generated, not
// stored — each track's `id` is the deterministic seed (see utils/artwork.js).
//
// Access model: listening is never interrupted and never timed. The free
// collection plays uninterrupted, forever, with no account. Subscribing opens
// the full library and every new piece as it's recorded — see `free` below.

import { AUDIO_BASE } from './config';

// Each category maps to one of the artwork visual languages. `accent` chooses
// the dominant palette colour; `style` selects the generator.
export const CATEGORIES = [
  {
    id: 'deep-focus',
    name: 'Deep Focus',
    style: 'depth',
    accent: 'teal',
    tagline: 'For the work that needs all of you',
    description:
      'Slow, low, and unhurried. Sustained chords and a line that barely moves — for long stretches of concentration: code, prose, proofs, the problem that does not yield quickly.',
    loop: false,
  },
  {
    id: 'creativity',
    name: 'Creativity',
    style: 'constellation',
    accent: 'teal',
    tagline: 'Something is being made',
    description:
      'Brighter and more curious. Open voicings and a melody that wanders without hurrying — for design, strategy, writing, and the idea you have not had yet.',
    loop: false,
  },
  {
    id: 'calm',
    name: 'Calm',
    style: 'candlelight',
    accent: 'gold',
    tagline: 'Set the work down',
    description:
      'Soft at every edge — felt piano, close and warm, with the room left in. For light reading, gentle recovery, and the quiet between sessions.',
    loop: false,
  },
];

// Track name, description, length in seconds, and whether it's in the free
// collection. Lengths vary — these are performances, not generated loops, so
// each ends where it wants to end and the next begins. The values below are
// placeholders in the 8–12 minute target range (see docs/production-briefs.md);
// replace each with the master's real length as it's recorded. One piece per
// category is free; the rest, and everything recorded from here on, come with a
// subscription.
const LIBRARY = {
  'deep-focus': [
    ['Fathom', 'A slow descent into clear, deep water. Left hand steady, everything else still.', 640, true],
    ['Throughline', 'One long, certain gesture. The work moves as a single line and does not break.', 720],
    ['Undertow', 'A quiet pressure that pulls you down into the problem, and through it.', 545],
    ['The Deep', 'Far below the noise. The lowest, sparest playing here — for the longest stretches.', 715],
  ],
  creativity: [
    ['Constellation', 'Points of light finding their lines. Open, unhurried, room to think.', 585, true],
    ['Ideation', 'Loose and bright. A melody that keeps almost settling, and then does not.', 500],
    ['Aperture', 'Wide open, in the major. Let the unexpected in.', 660],
  ],
  calm: [
    ['Vespers', 'Candlelight through silk. Felt hammers, close mics, and the room left in.', 615, true],
    ['Stillpoint', 'The quiet centre. The breath slows and the day softens.', 700],
    ['Reverie', 'Warm and diffuse, played almost under the breath. For light reading and recovery.', 560],
  ],
};

const slug = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

export const TRACKS = CATEGORIES.flatMap((category) =>
  LIBRARY[category.id].map(([name, description, durationSeconds, free = false]) => {
    const id = `${category.id}-${slug(name)}`;
    return {
      id,
      name,
      description,
      durationSeconds,
      categoryId: category.id,
      file: `${AUDIO_BASE}/${id}.mp3`,
      loop: category.loop,
      // In the free collection: plays uninterrupted, forever, without an account.
      free,
      // `id` is the artwork seed — deterministic, never hand-drawn.
      seed: id,
    };
  })
);

// The one place that decides whether a listener can play a given piece.
export function canPlay(track, isSubscriber) {
  if (!track) return false;
  return isSubscriber || track.free;
}

export function tracksByCategory(categoryId) {
  return TRACKS.filter((t) => t.categoryId === categoryId);
}

export function getTrack(trackId) {
  return TRACKS.find((t) => t.id === trackId) || null;
}

export function getCategory(categoryId) {
  return CATEGORIES.find((c) => c.id === categoryId) || null;
}

// The next piece to play after this one, wrapping around — used for
// auto-advance and for skip. Only ever returns something the listener can
// actually play, so the music continues without ever stopping to ask: a free
// listener advances through the free collection, a subscriber through the lot.
export function nextTrack(trackId, isSubscriber = false) {
  const track = getTrack(trackId);
  if (!track) return null;
  const siblings = tracksByCategory(track.categoryId).filter((t) => canPlay(t, isSubscriber));
  if (siblings.length === 0) return null;
  const i = siblings.findIndex((t) => t.id === trackId);
  // Not in the playable set (shouldn't happen) — start it at the top.
  if (i === -1) return siblings[0];
  return siblings[(i + 1) % siblings.length];
}

export function formatDuration(totalSeconds) {
  const m = Math.round((totalSeconds || 0) / 60);
  return `${m} min`;
}
