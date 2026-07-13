# Cadenzia — production briefs

Concrete direction for the two things that don't live in code: the **audio masters**
and the **generative artwork**. The goal is four categories that read as one family
but sit at four clearly different points on an energy axis. Distinctness comes from
pushing a small shared set of dials — density, warmth, structure, tempo, arousal — in
different directions, not from four unrelated ideas.

Source of truth for the categories and track list is
[`src/utils/tracks.js`](../src/utils/tracks.js); the artwork generators live in
[`src/utils/artwork.js`](../src/utils/artwork.js).

## At a glance

| | Deep Focus | Energy | Creativity | Calm |
|---|---|---|---|---|
| **Arousal** | Low but dense/immersive | High but controlled | Medium, open | Lowest, enveloping |
| **Tempo** | Pulseless | Steady legato pulse 100–110, no build | Loose, implied 88–96 | Pulseless |
| **Tonality** | Dark, modal, single drone | Bright, one fixed key | Bright, colourful, one fixed key | Warm, consonant, resolved |
| **Artwork** | `depth` — deep-water contours | `score` — abstracted staff | `constellation` — scattered notes | `candlelight` — warm washes |
| **Visual density** | Highest | Structured / geometric | Sparse, airy | Near-empty, blurred |
| **Warmth (clay↔pine)** | Coolest (deep glow only) | Warm gold accent | Cool-bright | Warmest, clay-dominant |
| **Length** | ~15 min seamless loop | ~15 min seamless loop | ~15 min seamless loop | ~15 min seamless loop |
| **Loops seamlessly** | **Yes** (`loop:true`) | **Yes** (`loop:true`) | **Yes** (`loop:true`) | **Yes** (`loop:true`) |

---

## Audio production briefs

**Shared rules (all four):** instrumental only, no vocals or spoken word, no recognisable
melodic hook that grabs the ear. **No percussion and no sharp transients anywhere** — not
even in Energy (see the stitch rules below); momentum comes from a legato pulse, never
beats. Nothing sudden — no drops, risers, impacts, builds, or silence gaps; evolution is
gradual only. Maintain a steady spectral floor so the track masks room noise. Mono-compatible
mix, gentle high-shelf roll-off to prevent fatigue over long sessions, controlled low end.
Master every track to the **same loudness** (target ~-17 LUFS integrated, tight true-peak
ceiling) so switching between them never jars.

### Everything loops — uniform ~15-minute seamless loops

**As of 2026-07-13 all four categories loop** (`loop:true` in `tracks.js`); each master is a
uniform **~15-minute (900s) seamless loop**. This supersedes the earlier split (short loops
for Deep Focus/Calm, long through-composed pieces for Energy/Creativity).

Why this model:
- **A seamless loop is the most flexible primitive.** It can hold one texture indefinitely
  *or* the player can auto-advance to the next track — a through-composed piece can only
  advance. For focus audio, holding a texture with no mid-work change is the whole point.
- **Why 15 minutes.** A 2–3 min loop gets *recognised* inside a normal work block — you start
  anticipating the return, which breaks focus. Recognition collapses past ~10–12 min. 30 min
  buys little more for roughly double the production and QA effort. 15 min is the sweet spot.

What that demands of the master (it follows from the player being a single bare `<audio>`
element that native-loops with **no crossfade** at the loop point):
- The loop join must be a **seamless, equal-energy splice** — the end flows into the start at
  the same level and density, no transient, no gap.
- **Bake no fades into the master.** A baked fade-in or fade-out replays at the loop point and
  dips on every pass. (The assembly step below closes the loop with a wrap-around crossfade
  instead of a baked fade.)

Playback-boundary fades (first play, the daily gate, a manual stop) are the player's job where
it can, the material's where it can't:
- On desktop/Android the player ramps element volume — real fades.
- On **iOS the OS pins element volume**, so the player detects that and **stops cleanly**
  rather than pretend-fading. Harmless here — every category is transient-free, so a wash
  simply ceases. If on-device testing shows the cut is too abrupt, give each track a short
  **outro file** (5–8s, from loop level, baked fade to silence) the player swaps to at the
  gate. Kept in reserve — don't build it unless testing calls for it.

### The four categories

Reference feels are named for *your ear*, not the tag box — ACE-Step doesn't do "in the style
of <artist>", so the tag strings translate these into describable timbres and moods.

#### Deep Focus — "for the work that needs all of you"
- **Energy:** low-arousal but *dense and immersive* — calm surface, deep pull. Sustained, never sleepy.
- **Tempo/pulse:** effectively pulseless; no drums. Any motion is tidal — 20–40s swell cycles, not a beat you could tap.
- **Harmony:** one tonal centre held for the whole track. Dark and modal (Aeolian/Dorian) or open fifths. Minimal harmonic movement is the point — movement is distraction.
- **Timbre:** deep sustained pads, low strings/cello drones, sub swells, filtered noise like distant water or pressure. Warm, dark, highs rolled off. Long, deep reverb tails that blur together.
- **Avoid:** arpeggios, bright bells, any percussion, melodic motifs longer than 2–3 buried notes.
- **The five (water/depth theme):** Fathom (clearest, most "water") · Undertow (more low-end pressure) · Throughline (one faintly sustained line the whole way) · Current (slightly more motion) · The Deep (darkest, lowest, longest).
- **Reference feel:** Stars of the Lid, Eno *Thursday Afternoon*, Biosphere *Substrata*, the stillest parts of Max Richter *Sleep*.

#### Energy — "the moment before beginning"
- **Energy:** high-arousal but *clean and controlled* — "energy you can think through," not workout music. Alert, upright, forward.
- **Tempo/pulse:** clear but restrained, **100–110 BPM**, carried by a **flowing legato ostinato** — a steady pulse held the whole way. **Set the tempo and hold it: sustained, even, no builds, no crescendo, no drop.** (This is the "sustained, not building" reshape — a crescendo can't loop.)
- **Harmony:** bright — major or Lydian/Mixolydian, optimistic without being saccharine. A gentle 2–4 chord cycle over one fixed centre.
- **Timbre:** soft-edged synth arpeggios and legato ostinato, warm sustained strings, soft-attack piano, pads that "breathe" with the pulse. Crisp but never piercing — **no percussion, no staccato, no sharp attacks** (they flam across a crossfade).
- **Avoid:** drums of any kind, EDM builds/drops, brass stabs, anything with a hard attack or that makes you want to dance instead of start.
- **The five:** Overture (anticipatory, opening) · First Light (warm, dawn) · Ascent (steady *elevated* plateau, not a climb) · Ignition (tightest, most focused drive) · Prelude (poised, restrained).
- **Reference feel:** Tycho, Bonobo (instrumental), Kiasmos (softer), Nils Frahm rhythmic pieces (*Says*, *Sunson*) — but with their beats stripped to a legato pulse.

#### Creativity — "something is being made"
- **Energy:** medium-arousal, open, exploratory. Bright but unhurried — leaves mental space rather than filling it.
- **Tempo/pulse:** loose, implied **88–96 BPM**, rhythm from gentle arpeggiation not drums. Spacious, lots of air between events (the "scattered notes").
- **Harmony:** the most harmonically colourful of the four — added-9ths, gentle suspensions, question-and-answer phrasing that resolves softly and stays open, never conclusive. One fixed key/centre.
- **Timbre:** soft bells and mallet tones **with long decay and reverb tails** (so nothing has a sharp attack), sparse Rhodes/pads, plucked textures softened by delay so single notes bloom and "connect" (the arcs in the artwork). Wide but soft stereo field.
- **Avoid:** dense arrangements, insistent rhythm, dark/heavy tones, hard mallet attacks, anything that sounds finished.
- **The five:** Constellation (most scattered) · Ideation (loose, bright) · Synthesis (threads converging) · Lattice (a gentle emerging pattern) · Aperture (widest, most reverberant).
- **Reference feel:** Ólafur Arnalds, Hania Rani, Nils Frahm *Ambre*, Bibio, brighter Eno (*Music for Airports*).

#### Calm — "set the work down"
- **Energy:** the lowest — warm, enveloping, restorative. For breaks and wind-down between sessions (adjacent to, but not, sleep).
- **Tempo/pulse:** none. Pure ambient wash; any motion is glacial (30–50s blooms).
- **Harmony:** warm and fully resolved — a single shimmering major/Lydian chord or the slowest possible drift. Nothing unresolved or tense.
- **Timbre:** diffuse warm pads, felt piano (distant, sparse single notes), tape saturation, soft vowel/choir textures, a faint comfort-floor of analog hiss or vinyl warmth, heavy reverb. Everything blurred — "candlelight through silk," no sharp transients anywhere.
- **Avoid:** any rhythm, any bright or sharp sound, hooks, tension, sub rumble, anything that starts or stops abruptly.
- **The five:** Vespers (candlelit, faint liturgical warmth) · Stillpoint (most centred) · Reverie (drifting, dreamy) · Lull (most dissolved) · Soften (softest, least content).
- **Reference feel:** Eno *Ambient 1/Music for Airports*, Grouper, Hammock, Marconi Union *Weightless*, stiller Max Richter.

---

## Generating the masters — ComfyUI + ACE-Step

The masters are generated on a rented GPU in **ComfyUI** with **ACE-Step**. Because ACE-Step
stays coherent only up to ~4 minutes, each 15-minute master is built from **four ~4-minute
segments** of the same track, crossfaded together into one piece, and looped.

### Why the four segments stitch cleanly — the tag rules

The finished track is four ~4-min renders crossfaded into one ~15-min piece, with the piece's
end crossfaded back into its start to close the loop. For those joins to be inaudible, any
segment of a track must be interchangeable with any other. Four rules make that true — all are
baked into the tag strings below:

1. **One prompt, four seeds — never four different prompts.** All four segments of a track use
   the *identical* tag string; only the **seed** changes. Same tags → same key, tempo,
   instrument palette, and density, so any segment crossfades into any other. Four different
   seeds still give four genuinely different ~4-min textures, so the 15 min *evolves* instead
   of repeating — but they never clash. (Writing a different prompt per part is the number-one
   way to get a lurch at a join.)
2. **No percussion, no sharp transients — every category, Energy included.** A crossfade
   overlaps two segments for several seconds; if either has drum hits or plucked/staccato
   attacks, you hear the two offset against each other (a flam). Sustained/legato material has
   nothing to misalign, so it crossfades invisibly. Energy's momentum comes from a *flowing
   legato ostinato and a steady harmonic pulse*, not beats.
3. **Fixed key + fixed tempo per track.** The key is pinned in every prompt so segments don't
   modulate against each other at a join. Where there's a pulse (Energy, Creativity) the BPM is
   pinned too. Beatless categories (Deep Focus, Calm) need no tempo at all — which is exactly
   why they're the most forgiving to stitch.
4. **Steady state, no arc.** No intro, outro, build, crescendo, drop, or ending — every segment
   sits at one even plateau. This matters twice: level-matched segments crossfade without a dip,
   and a flat plateau is what lets the loop close on itself.

The assembly step also loudness-normalises each segment and trims ACE-Step's soft intro/outro
ramp before crossfading, so residual differences are cleaned up in post — but the tags do most
of the work.

### ComfyUI settings (per segment)

Load ComfyUI's built-in **ACE-Step text-to-audio template** (Templates → Audio → ACE-Step).

| Field | Value |
|---|---|
| Checkpoint | `ace_step_v1_3.5b.safetensors` |
| **Tags** | the per-track string below (same for all 4 segments of a track) |
| **Lyrics** | *leave empty* — `instrumental` is already in the tags |
| Duration (`EmptyAceStepLatentAudio` → seconds) | **~240** (≈4:00; gives trim headroom for the ~15-min target) |
| **Seed** | the four values listed per track (change it between the 4 runs) |
| Steps | ~50 |
| CFG / guidance | ~4.5–5 (lower = more natural for ambient; higher over-follows the tags) |
| Sampler / scheduler / shift | template defaults (typically `euler` / `simple` / shift ~3) |
| Save as | **FLAC or 24/32-bit WAV**, 44.1 kHz stereo — *not* MP3 yet (encode once, at the end) |

**File naming:** save the four takes as `<id>-1.wav … <id>-4.wav`, e.g.
`deep-focus-fathom-1.wav`. The `<id>` values are the keys below and match `tracks.js`.

### Assembly (ffmpeg — script to come, not yet written)

Per track, from the four segment files → one `<id>.mp3`:
1. **Loudness-normalise** each segment (EBU R128, ~-17 LUFS) so levels match at the joins.
2. **Trim** ~3–5s of ACE-Step's soft intro/outro ramp off each segment's ends.
3. **Equal-power crossfade** segment 1→2→3→4 (~8s overlaps) into one ~15-min piece.
4. **Wrap-around crossfade** the piece's tail into its head (~8s) — the seamless native-loop
   point, since the player loops with no crossfade of its own.
5. **Encode** MP3 256 kbps CBR, 44.1 kHz → `<id>.mp3`, then upload to R2 (`focus-music-audio`,
   Worker-only, served through the `cad_stream` cookie gate).

> ffmpeg is **not** on the primary dev machine yet (`command -v ffmpeg` fails). Decide whether
> assembly runs on the GPU box (usually already has ffmpeg) or locally after installing it.

### Per-track tags

For each track: **paste the same Tags string four times, changing only the Seed** to the four
listed values. Leave the Lyrics box empty. Seeds are arbitrary but recorded here so any track
(or one bad segment) can be regenerated exactly.

#### Deep Focus — beatless, dark, modal

**Fathom** — `deep-focus-fathom` · D minor · beatless · seeds 1010, 1011, 1012, 1013
`deep ambient, dark ambient, submerged, slow evolving drones, warm low pads, subtle sub-bass, hypnotic, still, spacious reverb, beatless, no percussion, no sharp transients, minimal, sustained, no build, continuous, instrumental, D minor`

**Undertow** — `deep-focus-undertow` · C minor · beatless · seeds 1020, 1021, 1022, 1023
`dark ambient, deep drone, slow low-end swells, warm pads, muted, undercurrent, hypnotic, spacious reverb, beatless, no percussion, no sharp transients, minimal, sustained, no build, continuous, instrumental, C minor`

**Throughline** — `deep-focus-throughline` · A minor · beatless · seeds 1030, 1031, 1032, 1033
`ambient drone, one continuous sustained pad, unbroken, steady tonal centre, warm bowed strings, minimal movement, focused, spacious reverb, beatless, no percussion, no sharp transients, sustained, no build, seamless, instrumental, A minor`

**Current** — `deep-focus-current` · E minor · beatless · seeds 1040, 1041, 1042, 1043
`flowing ambient, gentle drifting motion, soft blurred arpeggio wash, warm pads, deep, calm momentum, spacious reverb, beatless, no percussion, no sharp transients, sustained, even, no build, continuous, instrumental, E minor`

**The Deep** — `deep-focus-the-deep` · C minor · beatless · seeds 1050, 1051, 1052, 1053
`very deep ambient, cavernous sub-bass drone, vast, dark, still, near-silent, ultra minimal, no melody, distant, spacious reverb, beatless, no percussion, no sharp transients, sustained, no build, continuous, instrumental, C minor`

#### Energy — legato pulse, bright, fixed key + BPM, no build

**Overture** — `energy-overture` · A minor · 100 BPM · seeds 2010, 2011, 2012, 2013
`minimalist neoclassical, flowing legato ostinato, warm strings, soft piano, clean, awake, bright, steady even momentum, sustained, no crescendo, no build, no percussion, no sharp transients, spacious, instrumental, A minor, 100 bpm`

**First Light** — `energy-first-light` · C major · 104 BPM · seeds 2020, 2021, 2022, 2023
`uplifting minimalist, gentle legato ostinato, warm strings, soft piano, bright, hopeful, dawn, steady even motion, sustained, no crescendo, no build, no percussion, no sharp transients, spacious, instrumental, C major, 104 bpm`

**Ascent** — `energy-ascent` · D major · 106 BPM · seeds 2030, 2031, 2032, 2033
`bright minimalist, steady legato arpeggio ostinato, warm strings, elevated, purposeful, awake, even sustained energy, plateau, no crescendo, no build, no percussion, no sharp transients, spacious, instrumental, D major, 106 bpm`

**Ignition** — `energy-ignition` · E minor · 110 BPM · seeds 2040, 2041, 2042, 2043
`minimalist, taut flowing ostinato, muted strings, soft synth pulse, focused, precise, restrained drive, steady even energy, sustained, no crescendo, no build, no percussion, no sharp transients, instrumental, E minor, 110 bpm`

**Prelude** — `energy-prelude` · G major · 102 BPM · seeds 2050, 2051, 2052, 2053
`minimalist neoclassical, poised legato piano ostinato, soft strings, clean, focused, ready, steady even motion, sustained, no crescendo, no build, no percussion, no sharp transients, spacious, instrumental, G major, 102 bpm`

#### Creativity — spacious, colourful, soft long-decay tones

**Constellation** — `creativity-constellation` · C Lydian · 90 BPM · seeds 3010, 3011, 3012, 3013
`ambient, soft glassy bell tones with long reverb tails, airy pads, spacious, generative, wonder, floating, warm reverb, no percussion, no sharp transients, sustained, even, no build, continuous, instrumental, C lydian, 90 bpm`

**Ideation** — `creativity-ideation` · F major · 92 BPM · seeds 3020, 3021, 3022, 3023
`bright ambient, soft mallet tones with long decay, warm pads, playful, curious, open, unhurried, gentle motion, spacious reverb, no percussion, no sharp transients, sustained, even, no build, continuous, instrumental, F major, 92 bpm`

**Synthesis** — `creativity-synthesis` · D major · 94 BPM · seeds 3030, 3031, 3032, 3033
`warm electronic ambient, interweaving synth layers, evolving harmony, converging textures, bright, cinematic, spacious reverb, no percussion, no sharp transients, sustained, even, no build, continuous, instrumental, D major, 94 bpm`

**Lattice** — `creativity-lattice` · A major · 96 BPM · seeds 3040, 3041, 3042, 3043
`minimalist ambient, interlocking soft arpeggios, crystalline synth with long reverb, geometric, bright, generative, spacious, no percussion, no sharp transients, sustained, even, no build, continuous, instrumental, A major, 96 bpm`

**Aperture** — `creativity-aperture` · E major · 88 BPM · seeds 3050, 3051, 3052, 3053
`expansive ambient, wide airy pads, shimmering synth, luminous, open space, calm wonder, weightless, spacious reverb, no percussion, no sharp transients, sustained, even, no build, continuous, instrumental, E major, 88 bpm`

#### Calm — beatless, warm, resolved, blurred

**Vespers** — `calm-vespers` · F major · beatless · seeds 4010, 4011, 4012, 4013
`warm ambient, soft felt piano, gentle pads, tape hiss, hazy, intimate, candlelit, tender, lo-fi warmth, spacious reverb, beatless, no percussion, no sharp transients, sustained, no build, continuous, instrumental, F major`

**Stillpoint** — `calm-stillpoint` · D minor · beatless · seeds 4020, 4021, 4022, 4023
`warm ambient, very slow breathing pads, soft drone, restful, still, minimal, soothing, spacious reverb, beatless, no percussion, no sharp transients, sustained, no build, continuous, instrumental, D minor`

**Reverie** — `calm-reverie` · B-flat major · beatless · seeds 4030, 4031, 4032, 4033
`soft dreamy ambient, blurred felt piano, warm pads, nostalgic, mellow, diffuse, gentle, lo-fi warmth, spacious reverb, beatless, no percussion, no sharp transients, sustained, no build, continuous, instrumental, B-flat major`

**Lull** — `calm-lull` · E-flat major · beatless · seeds 4040, 4041, 4042, 4043
`smeared ambient wash, dissolving textures, soft blurred pads, weightless, hazy, gentle, spacious reverb, beatless, no percussion, no sharp transients, sustained, no build, continuous, instrumental, E-flat major`

**Soften** — `calm-soften` · G major · beatless · seeds 4050, 4051, 4052, 4053
`gentle ambient, soft rounded pads, warm low tones, soothing, tender, calm, minimal, spacious reverb, beatless, no percussion, no sharp transients, sustained, no build, continuous, instrumental, G major`

---

## Artwork briefs

Four generator functions on the shared palette (warm alabaster paper, espresso ink
line-work, a pine accent used sparingly, a clay warmth) — one visual language per category.
The briefs define what each expresses and the dials that keep them distinct.

**The system across the energy axis:**
- **Density:** Deep Focus (highest) → Energy (structured medium) → Creativity (sparse) → Calm (near-empty)
- **Warmth:** Calm (warmest, clay) → Energy (warm gold accent) → Creativity (cool-bright) → Deep Focus (coolest)
- **Structure:** Energy (geometric/ruled) → Deep Focus (concentric order) → Creativity (organic network) → Calm (formless)
- **Motion:** Calm slowest drift · Deep Focus slow tidal breathing · Creativity out-of-phase twinkle · Energy a single pulsing note

### Deep Focus — `depth`
- **Metaphor:** looking straight down into deep water — pressure contours, a sounding chart.
- **Composition:** many concentric, slightly perturbed rings receding to an off-centre point, over a warm radial glow deep beneath. The densest of the four.
- **Palette:** coolest — ink-dominant line-work, clay confined to the deep glow, no bright accent. Darkest ink of the set.
- **Line & motion:** fine, numerous (16–21 rings), inner rings a touch heavier; the slowest, subtlest vertical "breathing."
- **Distinct because:** densest and coolest; concentric geometry reads as inward, downward focus.

### Energy — `score`
- **Metaphor:** a musical score at the downbeat, before the first note is played.
- **Composition:** crisp horizontal staff groups, a few note-heads, faint vertical bar-lines. The only ruled, geometric, upright language; left-to-right reading gives forward momentum.
- **Palette:** brightest paper (a "morning" lift), with a single warm/gold accent note-head as the focal point.
- **Line & motion:** precise, even-weight, ruled; one accent note-head gently pulses — rhythm implied without movement.
- **Distinct because:** the only geometric/structured language; horizontal and upright; the crispest contrast.

### Creativity — `constellation`
- **Metaphor:** notes scattered like stars, thin arcs joining nearest neighbours — ideas finding their lines.
- **Composition:** 7–10 note-points across the field with generous negative space, connected by faint curved arcs; some with musical stems. The most open, asymmetric layout.
- **Palette:** cool-bright and airy; a pine accent on a few "bright idea" notes, the rest ink.
- **Line & motion:** very fine arcs, small note-heads; points twinkle in opacity, out of phase — generative and alive.
- **Distinct because:** the only network/scattered language; most negative space; the twinkle motion.

### Calm — `candlelight`
- **Metaphor:** candlelight through silk — warmth with almost no structure.
- **Composition:** 5–6 large, soft, blurred clay/paper washes of warmth with one faint wavy line drifting through. The least line-work; nothing has a hard edge.
- **Palette:** warmest — clay-dominant and glowing, paper lifted; effectively no ink line-work (the lone wave is clay, very faint).
- **Line & motion:** essentially no line; the warm washes drift slowest and most organically, like a flicker.
- **Distinct because:** the only soft/blurred language, warmest, structureless — the visual opposite of Deep Focus's crisp dense contours.
