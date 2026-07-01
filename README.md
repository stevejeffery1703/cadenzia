# Cadenzia

Premium focus music for serious knowledge workers. Curated audio — binaural
beats, ambient compositions, and rhythmic soundscapes — engineered for deep
concentration, flow state, and creative thinking. Dark, sparse, and considered.

> The name comes from *cadenza*: the virtuoso passage where a performer reaches
> their peak. The product name is centralised in
> [`src/utils/config.js`](src/utils/config.js) (`APP_NAME`) and the PWA manifest.

---

## Stack

| Layer    | Choice |
|----------|--------|
| Frontend | React + React Router, Tailwind (CSS custom-property token system), Vite |
| Audio    | Web Audio API (two-element graph: fades, crossfade, analyser) + Media Session |
| Artwork  | Generated SVG, deterministic per track — no image files for track art |
| PWA      | Web App Manifest + service worker (installable, background playback) |
| Backend  | Cloudflare Workers (API + static assets + R2 audio streaming) |
| Storage  | Cloudflare R2 (audio), Cloudflare KV (sessions / share + auth tokens) |
| Database | Cloudflare D1 (SQLite) |
| Payments | Stripe (hosted Checkout + Billing Portal + signature-verified webhook) |
| Email    | Resend (sign-in codes + new-track announcements) |

## Brand system

A warm, editorial, **light** aesthetic — gallery paper, not a dark app.

- **Palette** — warm alabaster paper (raised/wash variants), espresso **ink** for
  text and the fine line-work, a single precious **pine** accent (mark, links,
  live/functional states — waveform, progress), and a muted **clay** that lives
  mostly in the artwork. All tokens are CSS custom properties in
  [`src/styles/global.css`](src/styles/global.css), exposed to Tailwind (incl.
  opacity modifiers) via `--rgb-*` channel variables.
- **Type** — **Newsreader** (an optically-sized editorial serif) for display,
  headlines, and track titles; **Hanken Grotesk** for UI. Distinctive, not the
  Cormorant/Inter default. Scale lives in `global.css` (`.text-display`, `.text-h1`…).
- **Mark** — a monoline note whose flag flows into a sound wave
  ([`src/components/Logo.jsx`](src/components/Logo.jsx)); note-head in ink, wave in pine.
- **Artwork** — fine ink line-work on warm paper (depth contours, a flowing wave,
  scattered notes, candlelight washes, a music staff). Engraving, not gradient blobs.
- **Voice** — sparse, confident, sentence case, no hype words, no emoji.

## What's built

- **Five categories, 25 tracks** ([`src/utils/tracks.js`](src/utils/tracks.js)):
  Deep Focus, Flow State, Creative Thinking, Restoration, Activation — each mapped
  to one of five generative artwork languages.
- **Generative artwork** ([`src/utils/artwork.js`](src/utils/artwork.js)) —
  deterministic SVG seeded by track id (deep water, gold thread, constellation,
  candlelight, abstracted score), one slow ambient animation, reduced-motion aware.
  Rendered to PNG for share cards.
- **Player** — Web Audio engine ([`src/hooks/useAudio.js`](src/hooks/useAudio.js))
  with 2s fade-in, 3s crossfade, auto-advance, analyser-driven waveform; large
  artwork, minimal controls, session timer. Library + now-playing + session panel,
  bottom sheet on mobile.
- **Free tier** — unlimited for the first hour of any session; then a calm
  interstitial offers *share to continue* or *subscribe*, equal weight
  ([`src/hooks/useSession.js`](src/hooks/useSession.js),
  [`src/components/ShareInterstitial.jsx`](src/components/ShareInterstitial.jsx)).
- **Sharing** — Web Share API with the artwork card, platform-intent fallbacks
  (X/LinkedIn/Facebook). Honor system: unlock on share-sheet open, no verification.
- **Play counter** — honest social proof, D1-backed, atomically incremented
  on track completion, held back below a threshold
  ([`src/components/PlayCounter.jsx`](src/components/PlayCounter.jsx)).
- **Subscription** — Stripe Checkout at **$2.99/month**, Billing Portal, webhook
  → D1. Passwordless auth (emailed code → session JWT).
- Landing, Science, Account (no gamification), plain-English Privacy. PWA.

> Audio files are **placeholders** — `tracks.js` points at `/audio/<id>.mp3`.
> Generate real masters embedding the right binaural frequency per category and
> upload them to the R2 bucket. Until then the player UI works but playback is
> silent / 404s (handled gracefully).

## Local development

```bash
npm install

# Terminal 1 — Vite dev server (UI). Honours $PORT, else http://localhost:5173
npm run dev

# Terminal 2 — Worker API on http://localhost:8787 (Vite proxies /api to it)
npm run worker:dev
```

Copy `.env.example` → `.env` and fill in keys. For the Worker, put secrets in a
`.dev.vars` file (same keys, no `VITE_` prefix) for `wrangler dev`. D1 needs its
own local schema too: `wrangler d1 migrations apply cadenzia-db --local`.

## Setup checklist

1. **Cloudflare D1** — create the database (`wrangler d1 create cadenzia-db`),
   put the returned `database_id` into [`wrangler.jsonc`](wrangler.jsonc), then
   apply the schema: `wrangler d1 migrations apply cadenzia-db --remote`
   (creates the tables and the `play_counter` seed row — see
   [`migrations/0001_init.sql`](migrations/0001_init.sql)).
2. **Stripe (test mode first)** — create a $2.99/month recurring price; set
   `STRIPE_PRICE_ID`. Add a webhook to `/api/subscription/webhook` and set
   `STRIPE_WEBHOOK_SECRET`.
3. **Cloudflare R2 + KV** — create the R2 bucket and a KV namespace; put the KV
   id into [`wrangler.jsonc`](wrangler.jsonc).
4. **Resend** — verify a sending domain; set `RESEND_API_KEY`.
5. **Secrets** — `wrangler secret put NAME` for each server-side value (see
   [`.env.example`](.env.example)). Never commit real secrets.

## Deploy

```bash
npm run deploy   # builds the React app, then `wrangler deploy`
```

Pushing to `main` runs [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml),
which builds and deploys to Cloudflare (needs `CLOUDFLARE_API_TOKEN` and
`CLOUDFLARE_ACCOUNT_ID` repo secrets).
