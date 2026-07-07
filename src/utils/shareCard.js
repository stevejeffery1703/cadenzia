// Builds the share card — a genuinely good-looking image, because the artwork is
// the real growth mechanism, not the gate. Full-bleed generated artwork with the
// listener's own quiet achievement over it ("3 hours of deep focus") and a small
// wordmark. Personal and understated — nothing that reads as an ad.

import { artworkSVG, svgToPngDataUrl } from './artwork';
import { APP_NAME } from './config';

const SIZE = 1080;

async function ensureFonts() {
  if (!document.fonts || !document.fonts.load) return;
  try {
    await Promise.all([
      document.fonts.load('300 96px "Spectral"'),
      document.fonts.load('400 28px "Hanken Grotesk"'),
    ]);
  } catch {
    /* fall back to system serif/sans */
  }
}

// Wrap the headline onto at most two lines so a longer achievement
// ("1 hour 30 minutes of creativity") never overflows the card.
function wrap(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 2);
}

// `headline` is the achievement line; `seed`/`style` pick the artwork. All
// optional — with no headline the card falls back to a plain wordmark.
export async function buildShareCard({ seed, style, headline } = {}) {
  const svg = artworkSVG({ seed, style, width: SIZE, height: SIZE, animate: false });
  const { dataUrl: artUrl } = await svgToPngDataUrl(svg, SIZE);
  await ensureFonts();

  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d');

  // Artwork, full bleed.
  const art = new Image();
  await new Promise((res, rej) => {
    art.onload = res;
    art.onerror = rej;
    art.src = artUrl;
  });
  ctx.drawImage(art, 0, 0, SIZE, SIZE);

  // Scrim so the type sits cleanly over the lower third — fade to warm paper.
  const scrim = ctx.createLinearGradient(0, SIZE * 0.5, 0, SIZE);
  scrim.addColorStop(0, 'rgba(245,241,232,0)');
  scrim.addColorStop(1, 'rgba(245,241,232,0.97)');
  ctx.fillStyle = scrim;
  ctx.fillRect(0, SIZE * 0.5, SIZE, SIZE * 0.5);

  ctx.textAlign = 'center';

  if (headline) {
    // The achievement is the hero; the wordmark sits quietly beneath it.
    ctx.fillStyle = '#232019';
    ctx.font = '300 60px "Spectral", Georgia, serif';
    const lines = wrap(ctx, headline, SIZE - 160);
    const baseY = SIZE - (lines.length > 1 ? 175 : 150);
    lines.forEach((ln, i) => ctx.fillText(ln, SIZE / 2, baseY + i * 68));

    ctx.fillStyle = '#6B6358';
    ctx.font = '400 26px "Hanken Grotesk", sans-serif';
    ctx.fillText(`with ${APP_NAME}`, SIZE / 2, SIZE - 70);
  } else {
    ctx.fillStyle = '#232019';
    ctx.font = '300 108px "Spectral", Georgia, serif';
    ctx.fillText(APP_NAME, SIZE / 2, SIZE - 120);
  }

  const dataUrl = canvas.toDataURL('image/png');
  const blob = await new Promise((res) => canvas.toBlob(res, 'image/png'));
  let file = null;
  try {
    file = new File([blob], 'cadenzia.png', { type: 'image/png' });
  } catch {
    /* File constructor unavailable — share without the image */
  }
  return { dataUrl, blob, file };
}
