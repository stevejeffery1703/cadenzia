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
| **Arousal** | Low but dense/immersive | High, gently driven | Medium, open | Lowest, enveloping |
| **Tempo & rhythm** | Pulseless, beatless | Gentle steady beat, 100–112 | Light beat, 88–96 | Pulseless, beatless |
| **Tonality** | Dark, modal, single drone | Bright, one fixed key | Bright, colourful, one fixed key | Warm, consonant, resolved |
| **Melody** | None — buried drones | Subtle repeating motif | Subtle evolving motif | None — soft washes |
| **Stereo** | Subtle width | Wide + slow auto-pan | Wide + slow auto-pan | Subtle width |
| **Artwork** | `depth` — deep-water contours | `score` — abstracted staff | `constellation` — scattered notes | `candlelight` — warm washes |
| **Visual density** | Highest | Structured / geometric | Sparse, airy | Near-empty, blurred |
| **Warmth (clay↔pine)** | Coolest (deep glow only) | Warm gold accent | Cool-bright | Warmest, clay-dominant |
| **Length** | ~15 min seamless loop | ~15 min seamless loop | ~15 min seamless loop | ~15 min seamless loop |
| **Loops seamlessly** | **Yes** (`loop:true`) | **Yes** (`loop:true`) | **Yes** (`loop:true`) | **Yes** (`loop:true`) |

The library now splits into two production families: **beatless washes** (Deep Focus,
Calm) and **rhythmic beds** (Energy, Creativity, in the Brain.fm mould — a gentle steady
beat, a warm bass pulse, a subtle recurring melody, and moving stereo). They share the
brand rules below but are *generated and assembled differently* — see "Two assembly paths".

---

## Audio production briefs

**Shared rules (all four):** instrumental only, no vocals or spoken word, no melodic hook
so catchy it pulls the ear off the work. **No arc, ever** — no drops, risers, impacts,
builds, or drum fills; the energy sits at one even plateau the whole way (a build or a fill
can't loop). Maintain a steady spectral floor so the track masks room noise. Keep the mix
**mono-compatible** (the stereo widening must not collapse oddly on a phone speaker), with a
gentle high-shelf roll-off against fatigue over long sessions, and controlled low end.
Master every track to the **same loudness** (~-17 LUFS integrated, tight true-peak ceiling)
so switching between them never jars.

Where the two families differ: the **beatless** categories stay free of percussion and
sharp transients (their masters are crossfade-stitched, and transients would flam at the
joins); the **rhythmic** categories now carry a soft, steady beat and subtle melody — fine,
because they're looped/extended as one continuous take, never crossfaded from separate ones.

### Everything loops — uniform ~15-minute seamless loops

**All four categories loop** (`loop:true` in `tracks.js`); each master is a uniform
**~15-minute (900s) seamless loop**. Beatless tracks loop on a seamless equal-energy splice;
rhythmic tracks loop on a **downbeat** (a whole number of bars) so the groove never stumbles
at the wrap.

Why this model:
- **A seamless loop is the most flexible primitive.** It can hold one texture indefinitely
  *or* the player can auto-advance — a through-composed piece can only advance.
- **Why 15 minutes.** A 2–3 min loop gets *recognised* inside a work block; recognition
  collapses past ~10–12 min; 30 min buys little more for double the effort. 15 min is the
  sweet spot. (For rhythmic tracks a shorter bar-locked loop is acceptable too — a steady
  groove is repetitive by design — but aim for 15 via *extend* where you can.)

What that demands of the master (the player is a single bare `<audio>` element that
native-loops with **no crossfade** at the loop point):
- The loop join must be **seamless** — equal-energy for washes, on a downbeat for grooves.
- **Bake no fades into the master.** A baked fade replays at the loop point and dips every
  pass. The assembly step closes the loop instead.

Playback-boundary fades (first play, the daily gate, a manual stop) are the player's job
where it can, the material's where it can't:
- On desktop/Android the player ramps element volume — real fades.
- On **iOS the OS pins element volume**, so the player detects that and **stops cleanly**.
  Harmless for the washes; for the rhythmic tracks the stop lands on whatever beat is
  playing, which is fine at the gate. If on-device testing shows it's abrupt, add a short
  **outro file** (5–8s, baked fade) the player swaps to. Kept in reserve.

### The four categories

Reference feels are named for *your ear*, not the tag box — ACE-Step doesn't do "in the
style of <artist>". The rhythmic two lean on **Brain.fm** as the touchstone: unobtrusive
electronic focus music, a soft steady beat, warm bass, a subtle repeating motif, rich moving
stereo — energising without ever demanding attention or building to a peak.

#### Deep Focus — "for the work that needs all of you"  ·  *beatless*
- **Energy:** low-arousal but *dense and immersive* — calm surface, deep pull. Sustained, never sleepy.
- **Tempo/pulse:** effectively pulseless; no drums. Any motion is tidal — 20–40s swell cycles, not a beat you could tap.
- **Harmony:** one tonal centre held for the whole track. Dark and modal (Aeolian/Dorian) or open fifths. Minimal harmonic movement is the point — movement is distraction.
- **Timbre:** deep sustained pads, low strings/cello drones, sub swells, filtered noise like distant water or pressure. Warm, dark, highs rolled off. Long, deep reverb tails that blur together.
- **Avoid:** arpeggios, bright bells, any percussion, melodic motifs longer than 2–3 buried notes.
- **The five (water/depth theme):** Fathom (clearest, most "water") · Undertow (more low-end pressure) · Throughline (one faintly sustained line the whole way) · Current (slightly more motion) · The Deep (darkest, lowest, longest).
- **Reference feel:** Stars of the Lid, Eno *Thursday Afternoon*, Biosphere *Substrata*, the stillest parts of Max Richter *Sleep*.

#### Energy — "the moment before beginning"  ·  *rhythmic*
- **Energy:** high-arousal but *clean and controlled* — "energy you can think through," not workout music. Alert, upright, forward, but even the whole way.
- **Tempo/rhythm:** a **gentle, steady electronic beat, 100–112 BPM** — soft kick, light hi-hats, maybe a shaker; think Brain.fm's "focus," not a club. A **warm sub-bass pulse** under it. **Set the groove and hold it — no builds, no drops, no fills, no crescendo.**
- **Melody/harmony:** bright — major or Lydian/Mixolydian. A **subtle, repeating melodic motif** (bright synth or soft piano/pluck) over a gentle 2–4 chord cycle on one fixed centre. Keep the motif understated and looping — present, not a hook.
- **Timbre:** warm analog synths, soft-edged plucks and arpeggios, breathing pads, a rounded bassline. Crisp but never piercing; a **wide, moving stereo field** (the auto-pan goes on in post).
- **Avoid:** big/EDM drums, four-on-the-floor that begs you to dance, builds/drops, brass stabs, anything with a hard peak.
- **The five:** Overture (anticipatory, opening) · First Light (warm, dawn) · Ascent (steady *elevated* plateau, not a climb) · Ignition (tightest, most driving) · Prelude (poised, restrained).
- **Reference feel:** Brain.fm focus/energy, Tycho, Bonobo (instrumental), Kiasmos (softer), Lane 8 (calmer) — steady grooves that stay level.

#### Creativity — "something is being made"  ·  *rhythmic (lighter)*
- **Energy:** medium-arousal, open, exploratory. Bright but unhurried — leaves mental space rather than filling it.
- **Tempo/rhythm:** a **light, gentle beat, 88–96 BPM** — soft kick, brushed/soft percussion, spacious, lots of air between events (the "scattered notes"). Warmer and looser than Energy.
- **Melody/harmony:** the most harmonically colourful of the four — added-9ths, gentle suspensions, question-and-answer phrasing that resolves softly and stays open. A **subtle, evolving motif** on bells, mallets or plucks with long decay, so notes bloom and "connect" (the arcs in the artwork). One fixed key/centre.
- **Timbre:** soft bells and mallet tones with long reverb tails, sparse Rhodes/pads, plucked textures softened by delay; a **wide, moving stereo field**.
- **Avoid:** dense arrangements, insistent or heavy rhythm, dark/heavy tones, hard mallet attacks, anything that sounds finished.
- **The five:** Constellation (most scattered) · Ideation (loose, bright) · Synthesis (threads converging) · Lattice (a gentle emerging pattern) · Aperture (widest, most reverberant).
- **Reference feel:** Brain.fm creativity/flow, Bibio, Bonobo, Ólafur Arnalds' brighter pieces, Nils Frahm *Ambre*.

#### Calm — "set the work down"  ·  *beatless*
- **Energy:** the lowest — warm, enveloping, restorative. For breaks and wind-down between sessions (adjacent to, but not, sleep).
- **Tempo/pulse:** none. Pure ambient wash; any motion is glacial (30–50s blooms).
- **Harmony:** warm and fully resolved — a single shimmering major/Lydian chord or the slowest possible drift. Nothing unresolved or tense.
- **Timbre:** diffuse warm pads, felt piano (distant, sparse single notes), tape saturation, soft vowel/choir textures, a faint comfort-floor of analog hiss or vinyl warmth, heavy reverb. Everything blurred — "candlelight through silk," no sharp transients anywhere.
- **Avoid:** any rhythm, any bright or sharp sound, hooks, tension, sub rumble, anything that starts or stops abruptly.
- **The five:** Vespers (candlelit, faint liturgical warmth) · Stillpoint (most centred) · Reverie (drifting, dreamy) · Lull (most dissolved) · Soften (softest, least content).
- **Reference feel:** Eno *Ambient 1/Music for Airports*, Grouper, Hammock, Marconi Union *Weightless*, stiller Max Richter.

---

## Generating the masters — ComfyUI + ACE-Step

Generated on a rented GPU in **ComfyUI** with **ACE-Step**. ACE-Step stays coherent only up
to ~4 min, so a 15-min master is never a single render.

### Two assembly paths

**Beatless — Deep Focus & Calm.** Generate **four ~4-min segments** (same tags, seed +1 each),
crossfade them into one ~15-min piece, then crossfade the tail back into the head to close
the loop. The crossfades are invisible because there are no transients to misalign.

**Rhythmic — Energy & Creativity.** A beat *cannot* be crossfaded from four independent takes
— their downbeats won't line up and you'll hear a flam. So make these as **one continuous
groove**, two ways (best first):
1. **Extend (preferred).** Generate one ~4-min seed, then use ComfyUI's ACE-Step
   **extend/continue** to grow the *same* take to ~15 min. The beat and key stay continuous —
   no joins at all — then close the loop on a downbeat.
2. **Short bar-locked loop (fallback).** If extend is fiddly, make one clean ~3–4 min take and
   loop *that* natively, cut exactly on a bar line. Groove-based focus music tolerates a short
   loop well — a steady beat is repetitive by design — as long as the melody stays subtle so
   nothing hooky recurs.

### The tag rules (both paths)

1. **Fixed key + fixed tempo per track**, pinned in every prompt. For the rhythmic tracks the
   BPM is load-bearing — it's what lets the loop close cleanly on a bar.
2. **No arc.** No intro, build, crescendo, drop, fill, or ending — one even plateau the whole
   way. (Brain.fm-style: energising by texture and groove, never by climbing.)
3. **Beatless path only:** no percussion / no sharp transients (so crossfades stay invisible).
   The rhythmic path *wants* a gentle beat — that's fine, it's looped/extended, not crossfaded.
4. **Beatless path only:** one prompt, four seeds — identical tags across the four segments so
   any one crossfades into any other. (Rhythmic tracks are one continuous take, so N/A.)

### Stereo movement — the Brain.fm sweep

Added in **post, not by tags** (ACE-Step won't give a clean rhythmic pan). The assembly script
applies it with ffmpeg:
- **Auto-pan** (`apulsator`) — a slow L→R→L sweep for depth and motion. **Loop-phase-locked:**
  the pan rate is chosen so a whole number of sweep cycles fit the loop (and an even number of
  bars on rhythmic tracks), so the stereo image is in the same place at the wrap — otherwise
  the loop point jumps.
- **Gentle widening** (`stereotools`/`extrastereo`) for richness, kept mono-compatible.
- **Pronounced on Energy & Creativity;** a much slower, subtler version optional on Deep Focus
  & Calm for depth. `wide stereo` is in the tags too, to give the panner a wide field.
- **Optional:** a very gentle beat-synced amplitude **tremolo** (`apulsator`/`tremolo`) for the
  full Brain.fm "neural-phase" pulsing. Same pass; hold unless you want it.

### ComfyUI settings (per render)

Load the **ACE-Step 1.5 Turbo** template (Base needs a checkpoint we don't have yet).

| Field | Value |
|---|---|
| Model variant | whichever you have — **use one variant for all 20** (family consistency) |
| **Tags** | the per-track string below |
| **Lyrics** | **`[inst]`** (an *empty* lyrics box can make ACE-Step output near-silence — use `[inst]`) |
| Duration (`EmptyAceStepLatentAudio` → seconds) | **~240** for beatless segments; for rhythmic, the seed length before extend |
| **Seed** | listed per track (beatless: 4 seeds; rhythmic: one seed for the take you extend) |
| **Steps / CFG / sampler / shift** | **use the loaded template's defaults — do NOT force numbers.** Turbo ≈ 8–10 steps, cfg ≈ 1; Base ≈ 50 steps, cfg ≈ 5. Forcing cfg 5 on a Turbo model produces near-silence + noise. |
| Save as | **FLAC** (Save Audio · Advanced), 44.1 kHz stereo — encode to MP3 once, at the end |

**File naming:** beatless takes → `<id>-1.flac … <id>-4.flac` (e.g. `deep-focus-fathom-1.flac`).
Rhythmic take → `<id>.flac` (single continuous take before extend).

### Assembly (ffmpeg — script to come, not yet written)

**Beatless tracks** (Deep Focus, Calm), four segments → one `<id>.mp3`:
1. **Loudness-normalise** each segment (EBU R128, ~-17 LUFS).
2. **Trim** ~3–5s of ACE-Step's soft intro/outro ramp off each end.
3. **Equal-power crossfade** 1→2→3→4 (~8s overlaps) into one ~15-min piece.
4. **Wrap-around crossfade** tail into head (~8s) — the seamless loop point.
5. Optional subtle **auto-pan + widen** (loop-phase-locked).
6. **Encode** MP3 256 kbps CBR, 44.1 kHz → `<id>.mp3`.

**Rhythmic tracks** (Energy, Creativity), one continuous take → one `<id>.mp3`:
1. **Loudness-normalise** to ~-17 LUFS.
2. **Trim to a whole number of bars** at the chosen tempo (so the loop closes on a downbeat).
3. **Close the loop** on the downbeat (tiny beat-aligned splice, or a very short crossfade).
4. **Auto-pan + widen** — pronounced, **loop-phase-locked to an even number of bars**.
5. **Encode** MP3 256 kbps CBR → `<id>.mp3`.

Then upload all to R2 (`focus-music-audio`, Worker-only, served via the `cad_stream` cookie).

> ffmpeg is **not** on the primary dev machine yet (`command -v ffmpeg` fails). Decide whether
> assembly runs on the GPU box (usually already has it) or locally after installing it.

### Per-track tags

For **beatless** tracks: paste the same Tags string four times, changing only the Seed to the
four listed values. For **rhythmic** tracks: use the single listed seed, generate one take, then
extend it. **Lyrics box = `[inst]`** everywhere. Seeds are recorded for reproducibility.

#### Deep Focus — beatless, dark, modal *(4 seeds, crossfaded)*

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

#### Energy — gentle steady beat, bright, subtle motif *(one take, extend)*

**Overture** — `energy-overture` · A minor · 100 BPM · seed 2010
`electronic focus music, gentle steady beat, soft kick, light hi-hats, warm sub-bass pulse, bright synth arpeggio, subtle uplifting motif, clean, awake, driving but relaxed, even energy, steady groove, no build, no drop, no fills, wide stereo, spacious, instrumental, A minor, 100 bpm`

**First Light** — `energy-first-light` · C major · 104 BPM · seed 2020
`electronic focus music, warm downtempo beat, soft kick, brushed hi-hats, warm bass pulse, bright piano and synth motif, hopeful, dawn, gentle momentum, even energy, steady groove, no build, no drop, no fills, wide stereo, spacious, instrumental, C major, 104 bpm`

**Ascent** — `energy-ascent` · D major · 108 BPM · seed 2030
`electronic focus music, propulsive but relaxed beat, soft kick, tight hi-hats, driving warm bassline, bright arpeggio, subtle motif, elevated, purposeful, even sustained energy, steady groove, no build, no drop, no fills, wide stereo, instrumental, D major, 108 bpm`

**Ignition** — `energy-ignition` · E minor · 112 BPM · seed 2040
`electronic focus music, tight driving beat, punchy soft kick, crisp hi-hats and shaker, focused warm bassline, muted arpeggio, precise motif, propulsive, energised, even energy, steady groove, no build, no drop, no fills, wide stereo, instrumental, E minor, 112 bpm`

**Prelude** — `energy-prelude` · G major · 102 BPM · seed 2050
`electronic focus music, poised gentle beat, soft kick, light hats, warm bass pulse, bright piano ostinato, subtle motif, clean, ready, focused, even energy, steady groove, no build, no drop, no fills, wide stereo, spacious, instrumental, G major, 102 bpm`

#### Creativity — light beat, colourful, evolving motif *(one take, extend)*

**Constellation** — `creativity-constellation` · C Lydian · 90 BPM · seed 3010
`electronic focus music, gentle downtempo beat, soft kick, soft rimshot, light percussion, warm bass, glassy bell and pluck melody, sparkling, generative, curious, spacious, even energy, steady groove, no build, no drop, wide stereo, instrumental, C lydian, 90 bpm`

**Ideation** — `creativity-ideation` · F major · 92 BPM · seed 3020
`electronic focus music, light playful beat, soft kick, brushed percussion, warm bass, bright marimba and mallet melody, curious, open, unhurried, uplifting, even energy, steady groove, no build, no drop, wide stereo, spacious, instrumental, F major, 92 bpm`

**Synthesis** — `creativity-synthesis` · D major · 94 BPM · seed 3030
`electronic focus music, warm downtempo beat, soft kick, gentle hats, rounded bassline, interweaving synth and pluck melody, evolving harmony, bright, flowing, even energy, steady groove, no build, no drop, wide stereo, instrumental, D major, 94 bpm`

**Lattice** — `creativity-lattice` · A major · 96 BPM · seed 3040
`electronic focus music, crisp light beat, soft kick, tight percussion, warm bass, interlocking bright arpeggios, crystalline melodic pattern, geometric, generative, even energy, steady groove, no build, no drop, wide stereo, instrumental, A major, 96 bpm`

**Aperture** — `creativity-aperture` · E major · 88 BPM · seed 3050
`electronic focus music, soft airy beat, gentle kick, light percussion, warm bass, wide shimmering synth, spacious pluck melody, luminous, open, expansive, even energy, steady groove, no build, no drop, wide stereo, spacious, instrumental, E major, 88 bpm`

#### Calm — beatless, warm, resolved, blurred *(4 seeds, crossfaded)*

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
