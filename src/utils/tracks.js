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
    loop: true,
  },
  {
    id: 'creativity',
    name: 'Creativity',
    style: 'constellation',
    accent: 'teal',
    tagline: 'Something is being made.',
    description:
      'Open and generative. Points of light finding their connections — for design, strategy, writing, and the idea you have not had yet.',
    loop: true,
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
// The third value is the master's length in seconds. Every category now loops
// seamlessly: each track is a ~15-minute evolving segment whose end returns
// cleanly to its start, so it holds a single texture for a whole work session
// without the ear ever clocking the repeat. 15 min sits past the point where a
// loop becomes noticeable, while staying cheap enough to master cleanly.
// Every master is a ~15-minute seamless loop (900s), so the length is uniform.
const LOOP_SECONDS = 900;
const LIBRARY = {
  'deep-focus': [
    ['Fathom', 'A slow descent into clear, deep water. For the work that needs all of you.', LOOP_SECONDS],
    ['Undertow', 'A quiet pressure that pulls you down into the problem, and through it.', LOOP_SECONDS],
    ['Throughline', 'Everything connects. The work moves as one long, certain gesture.', LOOP_SECONDS],
    ['Current', 'Caught in the flow and moving with it. Effort becomes motion.', LOOP_SECONDS],
    ['The Deep', 'Far below the noise. For the deepest and longest stretches of thought.', LOOP_SECONDS],
  ],
  energy: [
    ['Overture', 'The first bars before the work begins. Clean, structured, awake.', LOOP_SECONDS],
    ['First Light', 'Momentum without noise. For the start of a serious day.', LOOP_SECONDS],
    ['Ascent', 'Rising and deliberate. Energy you can think through.', LOOP_SECONDS],
    ['Ignition', 'The spark before motion. Precise and ready.', LOOP_SECONDS],
    ['Prelude', 'Poised at the edge of the work. Begin.', LOOP_SECONDS],
  ],
  creativity: [
    ['Constellation', 'Points of light finding their lines. For the open, generative hours.', LOOP_SECONDS],
    ['Ideation', 'Loose, bright, unhurried. Room for the thought you have not had yet.', LOOP_SECONDS],
    ['Synthesis', 'Separate things becoming one idea. For design, strategy, invention.', LOOP_SECONDS],
    ['Lattice', 'Structure emerging from possibility — connections you did not plan.', LOOP_SECONDS],
    ['Aperture', 'Wide open. Let the unexpected in.', LOOP_SECONDS],
  ],
  calm: [
    ['Vespers', 'Candlelight through silk. A soft place to set the work down.', LOOP_SECONDS],
    ['Stillpoint', 'The quiet centre. The breath slows and the day softens.', LOOP_SECONDS],
    ['Reverie', 'Warm and diffuse. For light reading and gentle recovery.', LOOP_SECONDS],
    ['Lull', 'Everything dissolves into everything else. Nothing sharp remains.', LOOP_SECONDS],
    ['Soften', 'The edges go. What is left is calm.', LOOP_SECONDS],
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
