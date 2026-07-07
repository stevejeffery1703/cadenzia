// The library. Single source of truth for categories and tracks.
//
// Audio files are placeholders until real masters are generated and uploaded to
// R2; `file` resolves against AUDIO_BASE. Track artwork is generated, not stored
// — each track's `id` is the deterministic seed (see utils/artwork.js).
//
// Access model: every track is available on the free tier. Listening is gated by
// time, not by track — see FREE_DAILY_MINUTES and the daily gate interstitial.

import { AUDIO_BASE } from './config';

// Each category maps to one of the four artwork visual languages. `accent`
// chooses the dominant palette colour; `style` selects the generator.
export const CATEGORIES = [
  {
    id: 'deep-focus',
    name: 'Deep Focus',
    style: 'depth',
    accent: 'teal',
    tagline: 'For the work that needs all of you.',
    description:
      'Dark, still, and very deep — then carried forward on one unbroken line. For sustained concentration and long stretches of momentum: code, prose, proofs, the problem that does not yield quickly.',
    // Loops seamlessly. Deep Focus is the "disappear into the work" category —
    // any change, even a clean advance, is a small interruption to a deep state,
    // and the material is featureless enough that a seamless loop is unnoticed.
    loop: true,
  },
  {
    id: 'energy',
    name: 'Energy',
    style: 'score',
    accent: 'gold',
    tagline: 'The moment before beginning.',
    description:
      'Precise and awake. Clean structural lines, like a score before the first note — for the start of a serious day, and the push to begin.',
    loop: false,
  },
  {
    id: 'creativity',
    name: 'Creativity',
    style: 'constellation',
    accent: 'teal',
    tagline: 'Something is being made.',
    description:
      'Open and generative. Points of light finding their connections — for design, strategy, writing, and the idea you have not had yet.',
    loop: false,
  },
  {
    id: 'calm',
    name: 'Calm',
    style: 'candlelight',
    accent: 'gold',
    tagline: 'Set the work down.',
    description:
      'Warm, diffuse, and soft at every edge. Candlelight through silk — for light reading, gentle recovery, and the quiet between sessions.',
    loop: true,
  },
];

// Track names and descriptions, in the brand voice. Per category, in order.
// The third value is the master's length in seconds. Deep Focus and Calm loop,
// so they're short seamless segments (~8–12 min) — length is invisible when the
// loop is seamless, and a shorter loop is far cheaper to master cleanly. Energy
// and Creativity auto-advance and have real character, so they're longer,
// through-composed pieces (~15–22 min) where a loop would be noticed.
const LIBRARY = {
  'deep-focus': [
    ['Fathom', 'A slow descent into clear, deep water. For the work that needs all of you.', 600],
    ['Undertow', 'A quiet pressure that pulls you down into the problem, and through it.', 660],
    ['Throughline', 'Everything connects. The work moves as one long, certain gesture.', 720],
    ['Current', 'Caught in the flow and moving with it. Effort becomes motion.', 600],
    ['The Deep', 'Far below the noise. For the deepest and longest stretches of thought.', 720],
  ],
  energy: [
    ['Overture', 'The first bars before the work begins. Clean, structured, awake.', 960],
    ['First Light', 'Momentum without noise. For the start of a serious day.', 1020],
    ['Ascent', 'Rising and deliberate. Energy you can think through.', 1080],
    ['Ignition', 'The spark before motion. Precise and ready.', 900],
    ['Prelude', 'Poised at the edge of the work. Begin.', 1020],
  ],
  creativity: [
    ['Constellation', 'Points of light finding their lines. For the open, generative hours.', 1080],
    ['Ideation', 'Loose, bright, unhurried. Room for the thought you have not had yet.', 1140],
    ['Synthesis', 'Separate things becoming one idea. For design, strategy, invention.', 1200],
    ['Lattice', 'Structure emerging from possibility — connections you did not plan.', 1020],
    ['Aperture', 'Wide open. Let the unexpected in.', 960],
  ],
  calm: [
    ['Vespers', 'Candlelight through silk. A soft place to set the work down.', 660],
    ['Stillpoint', 'The quiet centre. The breath slows and the day softens.', 720],
    ['Reverie', 'Warm and diffuse. For light reading and gentle recovery.', 600],
    ['Lull', 'Everything dissolves into everything else. Nothing sharp remains.', 720],
    ['Soften', 'The edges go. What is left is calm.', 660],
  ],
};

const slug = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

export const TRACKS = CATEGORIES.flatMap((category) =>
  LIBRARY[category.id].map(([name, description, durationSeconds]) => {
    const id = `${category.id}-${slug(name)}`;
    return {
      id,
      name,
      description,
      durationSeconds,
      categoryId: category.id,
      file: `${AUDIO_BASE}/${id}.mp3`,
      loop: category.loop,
      // `id` is the artwork seed — deterministic, never hand-drawn.
      seed: id,
    };
  })
);

export function tracksByCategory(categoryId) {
  return TRACKS.filter((t) => t.categoryId === categoryId);
}

export function getTrack(trackId) {
  return TRACKS.find((t) => t.id === trackId) || null;
}

export function getCategory(categoryId) {
  return CATEGORIES.find((c) => c.id === categoryId) || null;
}

// The next track in the same category, wrapping around — used for auto-advance
// and crossfade preloading.
export function nextTrack(trackId) {
  const track = getTrack(trackId);
  if (!track) return null;
  const siblings = tracksByCategory(track.categoryId);
  const i = siblings.findIndex((t) => t.id === trackId);
  return siblings[(i + 1) % siblings.length];
}

export function formatDuration(totalSeconds) {
  const m = Math.round((totalSeconds || 0) / 60);
  return `${m} min`;
}
