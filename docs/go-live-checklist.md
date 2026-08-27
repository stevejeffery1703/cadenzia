# Cadenzia — go-live checklist

**Cadenzia is deliberately unable to take money right now.** Payments are behind
a two-part kill switch that is OFF by default. This document is the note to
self: what is switched off, why, and everything that must be true before it goes
back on.

Work top to bottom. Nothing here is optional.

---

## ⚠️ 1. The payments kill switch (turn on LAST)

Payments are disabled in two places. **The server one is the real guard** — the
client flag only hides buttons.

| Where | Setting | Now | To go live |
|---|---|---|---|
| **Worker** (real guard) | `PAYMENTS_ENABLED` in [`wrangler.jsonc`](../wrangler.jsonc) `vars` | `"false"` | `"true"` |
| **Client** (cosmetic) | `VITE_PAYMENTS_ENABLED` at build time | unset | `true` |

While the Worker flag is off, `POST /api/subscription/checkout` returns **503**
before doing anything else — no Stripe Checkout Session can be created, whatever
the client sends (stale UI, the `/app?subscribe=1` deep link, a hand-rolled
POST). See [`src/worker/routes/subscription.js`](../src/worker/routes/subscription.js).

While the client flag is off, every subscribe CTA is replaced by
`PRELAUNCH_NOTE` — *"In development — come back soon."* (nav button hidden,
pricing CTA, subscribe modal, premium invite, account page). See
[`src/utils/config.js`](../src/utils/config.js).

Build for launch with:

```bash
VITE_PAYMENTS_ENABLED=true npm run build && npx wrangler deploy
```

**Do not flip either flag until everything below is done.**

---

## 2. Stripe — full re-setup required (NOT just a live swap)

The original Stripe account was **replaced in July 2026** (the old one carried
business settings from a previous business). Everything configured on the old
account is void, and Stripe objects never cross accounts — or test↔live within
one. The deployed secrets still point at the **old, abandoned account**, so
Stripe does not currently work at all, in either mode.

The integration **code** is account-agnostic (no hardcoded ids — everything is
secrets/env), so this is Dashboard config plus `wrangler secret put`. No code
changes expected.

Do it in **TEST** first, verify end to end, then repeat in **LIVE**:

- [ ] New **API keys** → `npx wrangler secret put STRIPE_SECRET_KEY`
- [ ] New **$4.99 recurring Price** → `npx wrangler secret put STRIPE_PRICE_ID`
- [ ] New **webhook endpoint** → `https://cadenzia.app/api/subscription/webhook`
      → `npx wrangler secret put STRIPE_WEBHOOK_SECRET`
- [ ] **Managed Payments (merchant of record)** — re-activate and re-pass
      eligibility review (it is per-account and does **not** transfer)
- [ ] Product **tax code `txcd_10401200`** (streaming subscription, MoR-eligible)
- [ ] Confirm API version **`2025-03-31.basil`** (pinned in code; Managed
      Payments needs it)
- [ ] **Founding-member coupon** — $2 off, Duration: Forever, with
      `max_redemptions` and `redeem_by` set
- [ ] **Re-run full test verification:** checkout → webhook flips
      `subscription_status` to `active` in D1 → tax withheld (~8.25% TX) →
      coupon coexists with Managed Payments
- [ ] **After the live swap:** confirm the receipt / tax-invoice email actually
      arrives (test mode does not send them) and check the "Sold through Link,
      LLC" merchant-of-record branding

---

## 3. The catalogue

- [ ] **Record the masters.** 10 pieces: 4 Deep Focus, 3 Creativity, 3 Calm —
      acoustic piano, per [`production-briefs.md`](production-briefs.md).
- [ ] Upload as `<id>.mp3` (`audio/mpeg`) to the R2 bucket `focus-music-audio`,
      named to match the ids in [`src/utils/tracks.js`](../src/utils/tracks.js).
- [ ] **Update each piece's real duration** in `tracks.js` (values there are
      placeholders).
- [ ] Confirm every piece is mastered to the **same integrated loudness**
      (~−16 to −18 LUFS). Consistency between pieces matters more than anything
      else — a level jump between tracks is what breaks concentration.
- [ ] Check the three **free** pieces (`deep-focus-fathom`,
      `creativity-constellation`, `calm-vespers`) are among the strongest — they
      are the shop window.
- [ ] Replace the old `calm-vespers` 20-second placeholder tone.

## 4. iOS on-device background test

Still outstanding, and it **gates launch** because the public copy promises
background playback (currently Android-verified only).

- [ ] On a real iPhone, both Safari tab and installed PWA: play a piece, lock the
      screen, switch apps — confirm audio continues and lock-screen controls work.
- [ ] If it fails: fix the iOS path, or soften the copy in `Player.jsx`,
      `Home.jsx` and `SubscribeModal.jsx`.

## 5. Compliance

- [ ] Set **`MAILING_ADDRESS`** as a Worker secret **before any marketing email**
      — `sendEmail` throws without it, and CAN-SPAM requires a physical address.
- [ ] Re-read Terms + Privacy against the shipped model (catalogue-gated free
      tier, no time limit, acoustic piano, streaming-only) and refresh the
      "last updated" dates.
- [ ] Confirm R2 public access is still **off** — no r2.dev URL, no public custom
      domain — or the `cad_stream` cookie gate on `/audio/*` is bypassable:
      `npx wrangler r2 bucket dev-url get focus-music-audio`
      `npx wrangler r2 bucket domain list focus-music-audio`

## 6. Final pre-flight

- [ ] `npm run build` clean, `npx wrangler deploy --dry-run` clean
- [ ] Smoke test live: home 200, `/api/plays/count` 200, `/api/auth/me` clean 401
- [ ] Bare `curl` of an `/audio/*` file → **403**; through the app → **200**
- [ ] Then, and only then, flip both payment flags (section 1) and deploy.
