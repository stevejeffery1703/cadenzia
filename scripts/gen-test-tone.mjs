// Generates a short, seamless ambient loop as a 16-bit mono WAV.
//
// This is a TEMPORARY placeholder so background playback can be tested on real
// devices before the actual masters exist. It is deliberately a seamless loop:
// every partial (and the tremolo) completes an integer number of cycles over
// the loop length, so the waveform value + slope match at the join and native
// <audio loop> repeats it with no click. Pair it with a category whose tracks
// loop (Calm) for an audio source that never ends — ideal for a lock-screen
// persistence test.
//
// Usage:
//   node scripts/gen-test-tone.mjs <outfile.wav> [seconds]
//
// Then upload to R2 under a track's object key (the .mp3 URL is cosmetic — the
// browser plays by Content-Type, not extension):
//   wrangler r2 object put focus-music-audio/calm-vespers.mp3 \
//     --file <outfile.wav> --content-type audio/wav --remote
//
// Replace with the real master (same key, Content-Type audio/mpeg) when ready.

import { writeFileSync } from 'node:fs';

const out = process.argv[2] || 'tone.wav';
const seconds = Number(process.argv[3] || 20);
const sampleRate = 22050; // low pad has no high-frequency content; keeps it small

// A calm, low A-major pad: [frequencyHz, relativeAmplitude].
const partials = [
  [110.0, 1.0], // A2
  [164.81, 0.6], // E3
  [220.0, 0.5], // A3
  [277.18, 0.28], // C#4
  [329.63, 0.2], // E4
].map(([f, a]) => {
  // Snap each partial to a whole number of cycles across the loop so the ends
  // meet seamlessly.
  const cycles = Math.max(1, Math.round(f * seconds));
  return { w: (2 * Math.PI * cycles) / (seconds * sampleRate), a };
});

// Slow "breathing" tremolo — also a whole number of cycles over the loop.
const lfoCycles = Math.max(1, Math.round(0.15 * seconds));
const lfoW = (2 * Math.PI * lfoCycles) / (seconds * sampleRate);

const N = Math.round(seconds * sampleRate);
const samples = new Float64Array(N);
let peak = 0;
for (let n = 0; n < N; n++) {
  let s = 0;
  for (const p of partials) s += p.a * Math.sin(p.w * n);
  s *= 0.85 + 0.15 * Math.sin(lfoW * n);
  samples[n] = s;
  if (Math.abs(s) > peak) peak = Math.abs(s);
}

// Normalise to a calm peak — headroom, never blasting.
const gain = peak > 0 ? 0.28 / peak : 1;

const dataSize = N * 2;
const buf = Buffer.alloc(44 + dataSize);
buf.write('RIFF', 0);
buf.writeUInt32LE(36 + dataSize, 4);
buf.write('WAVE', 8);
buf.write('fmt ', 12);
buf.writeUInt32LE(16, 16); // PCM fmt chunk size
buf.writeUInt16LE(1, 20); // PCM
buf.writeUInt16LE(1, 22); // mono
buf.writeUInt32LE(sampleRate, 24);
buf.writeUInt32LE(sampleRate * 2, 28); // byte rate
buf.writeUInt16LE(2, 32); // block align
buf.writeUInt16LE(16, 34); // bits per sample
buf.write('data', 36);
buf.writeUInt32LE(dataSize, 40);
for (let n = 0; n < N; n++) {
  let v = Math.round(samples[n] * gain * 32767);
  if (v > 32767) v = 32767;
  else if (v < -32768) v = -32768;
  buf.writeInt16LE(v, 44 + n * 2);
}

writeFileSync(out, buf);
console.log(
  `Wrote ${out}: ${seconds}s, ${sampleRate}Hz mono, ${(dataSize / 1048576).toFixed(2)} MiB`
);
