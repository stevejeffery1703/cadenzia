# Cadenzia — production briefs

Concrete direction for the two things that don't live in code: the **recorded
piano masters** and the **generative artwork**.

Source of truth for the categories and piece list is
[`src/utils/tracks.js`](../src/utils/tracks.js); the artwork generators live in
[`src/utils/artwork.js`](../src/utils/artwork.js).

> **This supersedes the previous AI-generation brief.** Cadenzia's catalogue was
> going to be generated (ACE-Step in ComfyUI, four categories, ~15-minute
> seamless loops). It is now **acoustic piano, played and recorded by hand**.
> That decision resolved every open licensing question at once — the recordings
> are owned outright, exclusive, and genuinely copyrightable, with no model
> terms, no non-exclusivity clause and no upstream litigation to inherit. It is
> also the better product: no generator we evaluated reached the quality bar.
> The **Energy** category was retired at the same time — solo piano has no
> distinctive voice for it. Three categories remain.

---

## The three categories

All three are the same instrument and the same room. Distinctness comes from
register, density and tempo — not from three unrelated ideas.

| | **Deep Focus** | **Creativity** | **Calm** |
|---|---|---|---|
| Feel | Slow, low, unhurried | Brighter, curious | Soft at every edge |
| Register | Low–mid, sparse | Mid–upper, open voicings | Mid, close and warm |
| Movement | A line that barely moves | A melody that wanders | Almost under the breath |
| Mode | Minor / modal | Major / lydian | Warm major, some minor |
| Use | Long concentration | Design, strategy, writing | Reading, recovery, between sessions |

**The rule that outranks everything: nothing sudden.** No sforzando, no sudden
register jumps, no dramatic dynamic swells, no rubato so free the pulse
disappears. Attention orients automatically to abrupt sound — every jolt is a
listener pulled out of their work. Play *under* what you'd play at a recital.

---

## Length and shape

- **Target roughly 8–12 minutes per piece.** Shorter than ~5 min and a work block
  turns into a playlist of songs; longer than ~15 min is hard to sustain as a
  good take and adds QA effort for little gain. Anything from ~6 min up is fine.
- **Lengths vary on purpose** — these are performances, not generated loops.
  `tracks.js` carries each piece's length in seconds; the values there now are
  placeholders, so update each one to the master's real length as you record it.
- **No seamless looping.** An expressive live take can't loop cleanly (tempo,
  dynamics and pedal won't match at the seam), and it doesn't need to: pieces
  are through-composed and the app auto-advances. `loop: false` on every
  category.
- **End softly.** Let the final chord resolve and ring out. A gentle close means
  the short gap before the next piece reads as a breath, not a stop.
- **Start gently.** No loud entrance after silence — that's the jolt again.

## Mastering

The single most important thing is **consistency between pieces**, not
per-piece perfection.

- **Master every piece to the same integrated loudness** — around **−16 to −18
  LUFS**. The exact figure matters far less than it being *identical* across the
  library. A volume jump between pieces is the most common way a focus catalogue
  breaks concentration.
- Gentle compression to keep the level even *within* a piece too — recorded
  piano drifts in level more than you expect over ten minutes.
- Keep the room. Close mics plus the natural space; felt or una corda where the
  piece wants it (Calm especially). Warmth and a little unevenness are the point
  — that's what generated audio flattens out.
- Deliver **`<id>.mp3`** (Content-Type `audio/mpeg`), named to match the track id
  in `tracks.js` — e.g. `deep-focus-fathom.mp3` — and upload to the R2 bucket
  `focus-music-audio`. Keep a lossless archive master (WAV/FLAC) off-bucket.

## The free collection

One piece per category is flagged `free: true` in `tracks.js` — currently
**Fathom**, **Constellation** and **Vespers**. These play uninterrupted and
forever, with no account and no clock. They are the shop window, so they should
be among the strongest pieces, not offcuts. Everything else, and everything
recorded from here on, comes with a subscription.

---

## Artwork

Unchanged, and still generated: deterministic SVG seeded by the track id, fine
ink line-work on warm paper. One visual language per category —
`depth` (Deep Focus), `constellation` (Creativity), `candlelight` (Calm). The
`score` generator is kept but unused since Energy was retired.
