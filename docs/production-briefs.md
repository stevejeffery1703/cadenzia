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
| **Tempo** | Pulseless (~50 BPM felt) | Steady pulse 85–110 | Loose/rubato 60–80 | No pulse |
| **Tonality** | Dark, modal, single drone | Bright major/Lydian | Bright, curious, colourful | Warm, consonant, resolved |
| **Artwork** | `depth` — deep-water contours | `score` — abstracted staff | `constellation` — scattered notes | `candlelight` — warm washes |
| **Visual density** | Highest | Structured / geometric | Sparse, airy | Near-empty, blurred |
| **Warmth (clay↔pine)** | Coolest (deep glow only) | Warm gold accent | Cool-bright | Warmest, clay-dominant |
| **Length** | ~8–12 min loop | ~15–22 min | ~15–22 min | ~8–12 min loop |
| **Loops seamlessly** | **Yes** (`loop:true`) | No | No | **Yes** (`loop:true`) |

---

## Audio production briefs

**Shared rules (all four):** instrumental only, no vocals or spoken word, no recognisable
melodic hook that grabs the ear. Nothing sudden — no drops, risers, impacts, or silence
gaps; evolution is gradual only. Maintain a steady spectral floor so the track masks room
noise. Mono-compatible mix, gentle high-shelf roll-off to prevent fatigue over long
sessions, controlled low end. Master every track to the **same loudness** (target ~-17 LUFS
integrated, tight true-peak ceiling) so switching between them never jars.

### Loops, lengths, and fades

Which categories loop decides everything else, so settle it first. It follows from one
fact about the player: it's a single bare `<audio>` element (for reliable iOS background
playback), so there's **no live layering or generative variation** — the only tools for
"length without boredom" are one long file or auto-advancing files.

- **Deep Focus & Calm loop** (`loop:true`). They're the "disappear into the work"
  categories — the least eventful, so a seamless loop goes unnoticed, and looping
  guarantees *zero* mid-work change. Master them as **short, seamless ~8–12 min segments**:
  length is invisible once the loop is seamless, and a short loop is far cheaper to master
  cleanly than 30 unique minutes. The loop join must be an **equal-energy splice** — the end
  flows into the start at the same level, phase-aligned, no transient. **Bake no fades into a
  looping master:** a baked fade-in or -out replays at the loop point and dips every pass.
- **Energy & Creativity auto-advance** through their five pieces. They have real character
  (pulse, arpeggios), so a loop would be caught. Master them as **longer, through-composed
  ~15–22 min pieces**, and **bake a gentle fade-in (~2s) and fade-out (~4–6s)** into each,
  keeping the first/last ~8s low-energy so the player's 3s dip on auto-advance lands cleanly
  everywhere, iOS included.

Fades at *playback boundaries* (first play, the daily gate, a manual stop) are the player's
job where it can, and the material's where it can't:

- On desktop/Android the player ramps element volume — real fades.
- On **iOS the OS pins element volume**, so the player detects that and **stops cleanly**
  rather than pretend-fading. For the looping categories that's harmless — they're
  transient-free, so a drone simply ceases. If on-device testing ever shows the cut is too
  abrupt, give each looping track a short **outro file** (5–8s, starting at loop level,
  baked fade to silence) that the player can swap to at the gate for a true fade. Kept in
  reserve — don't build it unless testing calls for it.

### Deep Focus — "for the work that needs all of you"
- **Energy:** low-arousal but *dense and immersive* — calm surface, deep pull. Sustained, never sleepy.
- **Tempo/pulse:** effectively pulseless; no drums. Any motion is tidal — 20–40s swell cycles, not a beat you could tap.
- **Harmony:** one tonal centre held for the whole track. Dark and modal (Aeolian/Dorian) or open fifths. Minimal harmonic movement is the point — movement is distraction.
- **Timbre:** deep sustained pads, low strings/cello drones, sub swells, filtered noise like distant water or pressure. Warm, dark, highs rolled off. Long, deep reverb tails that blur together.
- **Avoid:** arpeggios, bright bells, any percussion, melodic motifs longer than 2–3 buried notes.
- **The five (water/depth theme):** Fathom (clearest, most "water") · Undertow (more low-end pressure) · Throughline (one faintly sustained line the whole way) · Current (slightly more motion) · The Deep (darkest, lowest, longest).
- **Touchstones:** Stars of the Lid, Eno *Thursday Afternoon*, Biosphere *Substrata*, the stillest parts of Max Richter *Sleep*.

### Energy — "the moment before beginning"
- **Energy:** high-arousal but *clean and controlled* — "energy you can think through," not workout music. Alert, upright, forward.
- **Tempo/pulse:** clear but restrained, **85–110 BPM**. A soft motorik / pulsing-eighths bed that gives momentum without demanding attention. Set the tempo and hold it — no builds to a drop.
- **Harmony:** bright — major or Lydian/Mixolydian, optimistic without being saccharine. A gentle 2–4 chord cycle over one centre.
- **Timbre:** soft-edged synth arps, warm plucks, muted mallets/marimba, pads that "breathe" with the pulse, a whisper of shaker/brush (texture, not a backbeat). Crisp but never piercing.
- **Avoid:** heavy or four-on-the-floor drums, EDM builds/drops, brass stabs — anything that makes you want to dance instead of start.
- **The five:** Overture (anticipatory, opening) · First Light (warm, dawn) · Ascent (gradual layered rise) · Ignition (tightest, most propulsive) · Prelude (poised, restrained).
- **Touchstones:** Tycho, Bonobo (instrumental), Kiasmos (softer), Nils Frahm rhythmic pieces (*Says*, *Sunson*).

### Creativity — "something is being made"
- **Energy:** medium-arousal, open, exploratory. Bright but unhurried — leaves mental space rather than filling it.
- **Tempo/pulse:** loose/rubato, **60–80 BPM**, rhythm implied by arpeggiation not drums. Spacious, lots of air between events (the "scattered notes").
- **Harmony:** the most harmonically colourful of the four — added-9ths, gentle suspensions, question-and-answer phrasing that resolves softly and stays open, never conclusive.
- **Timbre:** sparse piano or Rhodes, plucked harp/kalimba, soft bells, generous reverb and delay so single notes bloom and "connect" (the arcs in the artwork). Hand-played human timing, wide but soft stereo field.
- **Avoid:** dense arrangements, insistent rhythm, dark/heavy tones, anything that sounds finished.
- **The five:** Constellation (most scattered) · Ideation (loose, bright) · Synthesis (threads converging) · Lattice (a gentle emerging pattern) · Aperture (widest, most reverberant).
- **Touchstones:** Ólafur Arnalds, Hania Rani, Nils Frahm *Ambre*, Bibio, brighter Eno (*Music for Airports*).

### Calm — "set the work down"
- **Energy:** the lowest — warm, enveloping, restorative. For breaks and wind-down between sessions (adjacent to, but not, sleep).
- **Tempo/pulse:** none. Pure ambient wash; any motion is glacial (30–50s blooms). **Must loop seamlessly** — start and end on the same held warmth.
- **Harmony:** warm and fully resolved — a single shimmering major/Lydian chord or the slowest possible drift. Nothing unresolved or tense.
- **Timbre:** diffuse warm pads, felt piano (distant, sparse single notes), tape saturation, soft vowel/choir textures, a faint comfort-floor of analog hiss or vinyl warmth, heavy reverb. Everything blurred — "candlelight through silk," no sharp transients anywhere.
- **Avoid:** any rhythm, any bright or sharp sound, hooks, tension, sub rumble, anything that starts or stops abruptly.
- **The five:** Vespers (candlelit, faint liturgical warmth) · Stillpoint (most centred) · Reverie (drifting, dreamy) · Lull (most dissolved) · Soften (softest, least content).
- **Touchstones:** Eno *Ambient 1/Music for Airports*, Grouper, Hammock, Marconi Union *Weightless*, stiller Max Richter.

### Producing the masters
If generating with AI tools (Suno/Udio etc.), specify "instrumental, no vocals" **every
time** — they add lyrics otherwise — at the tempos/timbres above. Those tools cap at short
clips, so the realistic pipeline is: generate a strong 1–3 min seed per track, then
extend/layer/loop it to full length in a DAW, apply the shared master chain (high-shelf
roll-off, gentle bus compression, unified LUFS), and hand-craft a **seamless, equal-energy
loop point for the Deep Focus and Calm tracks**. For the auto-advancing Energy and
Creativity tracks, bake the gentle fade-in/-out and keep the opening and closing 5–10s low
so the 3s dip on advance lands cleanly (see *Loops, lengths, and fades* above).

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
