// Single source of truth for per-route title/description, keyed by path.
// Consumed by both the frontend (useDocumentHead, for the client-rendered
// page and JS-executing crawlers like Googlebot) and the Worker
// (HTMLRewriter, for the raw HTML that non-JS crawlers and social-media
// unfurlers see) — keeping the two from silently drifting apart. Plain data,
// no DOM/browser APIs, so it's safe to import from both bundles.
export const PAGE_META = {
  '/': {
    title: 'Cadenzia — Find your cadence',
    description: 'Curated instrumental audio for deep focus, energy, creativity, and calm.',
  },
  '/app': {
    title: 'Listen — Cadenzia',
    description:
      'Stream deep focus, energy, creativity, and calm audio — free for an hour every day.',
  },
  '/science': {
    title: 'The science, plainly — Cadenzia',
    description:
      'How Cadenzia is made to hold your attention — instrumental, steady, and distraction-masking — with the research behind it.',
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
