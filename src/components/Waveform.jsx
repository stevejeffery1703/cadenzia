import { useEffect, useRef } from 'react';

// Ambient waveform. Cosmetic only — there is no live audio spectrum to read
// (playback runs on a bare <audio> element for reliable background playback, not
// through Web Audio). While playing it draws a slow, low-amplitude pine swell;
// paused, or under reduced-motion, it settles to a faint static line.
const PINE = '#2F4A3C';
const PINE_BRIGHT = '#3E624F';
const GHOST = '#CFC6B5';

export default function Waveform({ playing, bars = 56, className = '' }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    const reduce =
      window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const sizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const { clientWidth: w, clientHeight: h } = canvas;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return { w, h };
    };

    let { w, h } = sizeCanvas();

    const drawBars = (amplitudes) => {
      ctx.clearRect(0, 0, w, h);
      const gap = 2;
      const bw = (w - gap * (bars - 1)) / bars;
      const mid = h / 2;
      for (let i = 0; i < bars; i++) {
        const a = amplitudes[i] ?? 0;
        const barH = Math.max(1.5, a * (h * 0.42));
        const x = i * (bw + gap);
        const grad = ctx.createLinearGradient(0, mid - barH, 0, mid + barH);
        grad.addColorStop(0, PINE_BRIGHT);
        grad.addColorStop(1, PINE);
        ctx.fillStyle = a > 0.04 ? grad : GHOST;
        ctx.globalAlpha = a > 0.04 ? 0.85 : 0.55;
        ctx.beginPath();
        const r = Math.min(bw / 2, 1.5);
        roundRect(ctx, x, mid - barH, bw, barH * 2, r);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    const staticBars = () =>
      Array.from({ length: bars }, (_, i) => 0.03 + 0.015 * Math.sin(i * 0.5));

    // A gentle travelling swell built from two slow, out-of-phase sines — calm
    // motion that reads as "playing" without pretending to track the audio.
    const swellBars = (time) =>
      Array.from({ length: bars }, (_, i) => {
        const phase = i * 0.35;
        const s1 = Math.sin(time * 0.0016 + phase) * 0.5 + 0.5;
        const s2 = Math.sin(time * 0.0009 + phase * 0.6) * 0.5 + 0.5;
        return 0.06 + 0.12 * s1 * s2;
      });

    const loop = (time) => {
      if (playing && !reduce) {
        drawBars(swellBars(time || 0));
        rafRef.current = requestAnimationFrame(loop);
      } else {
        drawBars(staticBars());
      }
    };

    loop(0);

    const onResize = () => {
      ({ w, h } = sizeCanvas());
      if (!(playing && !reduce)) drawBars(staticBars());
    };
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', onResize);
    };
  }, [playing, bars]);

  return <canvas ref={canvasRef} className={`h-full w-full ${className}`} aria-hidden="true" />;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
