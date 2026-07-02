// Single source of truth for per-route title/description, keyed by path.
// Consumed by both the frontend (useDocumentHead, for the client-rendered
// page and JS-executing crawlers like Googlebot) and the Worker
// (HTMLRewriter, for the raw HTML that non-JS crawlers and social-media
// unfurlers see) — keeping the two from silently drifting apart. Plain data,
// no DOM/browser APIs, so it's safe to import from both bundles.
export const PAGE_META = {
  '/': {
    title: 'Cadenzia — Find your cadence',
    description: 'Curated audio engineered for deep concentration, flow state, and creative work.',
  },
  '/app': {
    title: 'Listen — Cadenzia',
    description:
      'Stream deep focus, flow state, and creative-thinking audio — free for the first hour of every session.',
  },
  '/science': {
    title: 'The science, plainly — Cadenzia',
    description:
      'How binaural beats and brainwave entrainment work, explained simply, with cited research and a frequency guide.',
  },
  '/privacy': {
    title: 'Privacy — Cadenzia',
    description: 'What Cadenzia stores, what it never does, and how to delete your data.',
  },
  '/terms': {
    title: 'Terms — Cadenzia',
    description: 'The complete terms of service for Cadenzia, in plain English.',
  },
  '/account': {
    title: 'Account — Cadenzia',
    description: 'Sign in, manage your subscription, and control your data.',
  },
};
