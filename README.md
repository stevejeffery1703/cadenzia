# Cadenzia

Focus music for serious knowledge workers. **Acoustic piano, played and recorded
by hand** — never generated — made to stay out of your way: no words, nothing
sudden, a steady floor that masks distraction.

> The name comes from *cadenza*: the virtuoso passage where a performer reaches
> their peak. The product name is centralised in
> [`src/utils/config.js`](src/utils/config.js) (`APP_NAME`) and the PWA manifest.

> ### ⚠️ Pre-launch: payments are switched OFF
>
> Cadenzia cannot take money right now, by design — the catalogue is still being
> recorded. `POST /api/subscription/checkout` returns **503** while the Worker's
> `PAYMENTS_ENABLED` var is `"false"` (the real guard), and the client's
> `VITE_PAYMENTS_ENABLED` flag replaces every subscribe CTA with *"In development
> — come back soon."*
>
> **Both must be turned on to launch — see
> [`docs/go-live-checklist.md`](docs/go-live-checklist.md) first.** Stripe also
> needs a full re-setup: the account was replaced in July 2026 and the deployed
> secrets still point at the old, abandoned one.

---

## Stack

| Layer    | Choice |
|----------|--------|
| Frontend | React + React Router, Tailwind (CSS custom-property token system), Vite |
| Audio    | A single bare HTML5 `<audio>` element + Media Session API (reliable lock-screen / background playback; no Web Audio) |
| Artwork  | Generated SVG, deterministic per track — no image files for track art |
| PWA      | Web App Manifest + service worker (installable, background playback) |
| Backend  | Cloudflare Workers (API + static assets + R2 audio streaming) |
| Storage  | Cloudflare R2 (audio), Cloudflare KV (sign-in codes + rate-limit buckets) |
| Database | Cloudflare D1 (SQLite) |
| Payments | Stripe (hosted Checkout + Billing Portal + signature-verified webhook) — **currently disabled, see above** |
| Email    | Resend (sign-in codes + new-track announcements) |

## Brand system

A warm, editorial, **light** aesthetic — gallery paper, not a dark app.

- **Palette** — warm alabaster paper (raised/wash variants), espresso **ink** for
  text and the fine line-work, a single precious **pine** accent (mark, links,
  live/functional states — waveform, progress), and a muted **clay** that lives
  mostly in the artwork. All tokens are CSS custom properties in
  [`src/styles/global.css`](src/styles/global.css), exposed to Tailwind (incl.
  opacity modifiers) via `--rgb-*` channel variables.
- **Type** — **Spectral** (a warm, quiet editorial serif) for display,
  headlines, and track titles; **Hanken Grotesk** for UI. Distinctive, not the
  Cormorant/Inter default. Scale lives in `global.css` (`.text-display`, `.text-h1`…).
- **Mark** — a monoline note whose flag flows into a sound wave
  ([`src/components/Logo.jsx`](src/components/Logo.jsx)); note-head in ink, wave in pine.
- **Artwork** — fine ink line-work on warm paper (depth contours, scattered notes,
  candlelight washes, a music staff). Engraving, not gradient blobs.
- **Voice** — sparse, confident, sentence case, no hype words, no emoji.

## What's built

- **Three categories, 10 pieces** ([`src/utils/tracks.js`](src/utils/tracks.js)):
  Deep Focus, Creativity, Calm — each mapped to a generative artwork language.
  Every piece is an **acoustic piano performance, played and recorded by hand** —
  nothing is generated. Pieces are through-composed (they end rather than loop)
  and run roughly 8–12 minutes, so lengths vary as performances do.
- **Generative artwork** ([`src/utils/artwork.js`](src/utils/artwork.js)) —
  deterministic SVG seeded by track id (deep water, abstracted score, constellation,
  candlelight), one slow ambient animation, reduced-motion aware.
  Rendered to PNG for share cards.
- **Player** — a single bare `<audio>` element + Media Session
  ([`src/hooks/useAudio.js`](src/hooks/useAudio.js)) for reliable background /
  lock-screen playback: 2s fade-in, dip-and-swap track changes, auto-advance, and a
  synthetic ambient waveform (no analyser — nothing routes through Web Audio, which
  iOS suspends on background/lock). Large artwork, minimal controls, session timer.
  Library + now-playing + session panel, bottom sheet on mobile.
- **Two tiers, gated on catalogue — never on time.** Free is a collection of
  pieces (one per category, flagged `free` in `tracks.js`) that plays
  uninterrupted, with no account, no clock and no daily cap. **Premium ($4.99/mo)
  opens the full library and every new piece as it's recorded.** Nothing in the
  app stops the music: auto-advance only ever selects a piece the listener can
  play (`nextTrack(id, isSubscriber)`), and reaching for a piece from the full
  collection opens a dialog *over* the still-playing music
  ([`src/components/PremiumInvite.jsx`](src/components/PremiumInvite.jsx)).
  (Streaming-only — no file downloads; reliable offline on iOS would need a
  native wrapper, deferred as a post-launch decision.)
- **Sharing** — never a toll and never an interruption. Offered as a personal
  achievement ("3 hours of deep focus") on positive surfaces
  ([`src/components/FocusShare.jsx`](src/components/FocusShare.jsx)), and as a
  decoupled word-of-mouth invitation beneath the premium offer, framed by the
  no-ads ethos. A plain link with the artwork card: Web Share API plus
  platform-intent fallbacks (X/LinkedIn/Facebook).
- **Play counter** — honest social proof, D1-backed, atomically incremented
  on track completion, held back below a threshold
  ([`src/components/PlayCounter.jsx`](src/components/PlayCounter.jsx)).
- **Subscription** — Stripe Checkout at **$4.99/month** (Stripe is merchant of
  record via Managed Payments), Billing Portal, signature-verified webhook → D1.
  Passwordless auth (emailed code → session JWT).
- **Audio origin** — streamed from R2 through the Worker with HTTP Range support
  (seeking + iOS background playback), gated by a short-lived signed cookie the
  app sets on each HTML load so the catalogue isn't hotlinkable or grabbable by a
  bare URL ([`src/worker/index.js`](src/worker/index.js)).
- Landing, Science, Account (no gamification), plain-English Privacy + Terms. PWA.

> Audio files are **placeholders** — `tracks.js` points at `/audio/<id>.mp3`.
> Generate real instrumental masters suited to each category and upload them to
> the R2 bucket. Until then the player UI works but playback is silent / 404s
> (handled gracefully).

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
2. **Stripe (test mode first)** — create a $4.99/month recurring price; set
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
