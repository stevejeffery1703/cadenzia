// Builds the share card — a genuinely good-looking image, because the artwork is
// the real growth mechanism, not the gate. Full-bleed generated artwork with a
// quiet wordmark and a plain caption. No hype, nothing that reads as an ad.

import { artworkSVG, svgToPngDataUrl } from './artwork';
import { getCategory } from './tracks';
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

export async function buildShareCard(track) {
  const category = getCategory(track.categoryId);
  const svg = artworkSVG({ seed: track.seed, style: category?.style, width: SIZE, height: SIZE, animate: false });
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
  const scrim = ctx.createLinearGradient(0, SIZE * 0.55, 0, SIZE);
  scrim.addColorStop(0, 'rgba(245,241,232,0)');
  scrim.addColorStop(1, 'rgba(245,241,232,0.96)');
  ctx.fillStyle = scrim;
  ctx.fillRect(0, SIZE * 0.55, SIZE, SIZE * 0.45);

  // Wordmark, in ink.
  ctx.textAlign = 'center';
  ctx.fillStyle = '#232019';
  ctx.font = '300 108px "Spectral", Georgia, serif';
  ctx.fillText(APP_NAME, SIZE / 2, SIZE - 150);

  // Caption — plain, no hype.
  ctx.fillStyle = '#6B6358';
  ctx.font = '400 30px "Hanken Grotesk", sans-serif';
  ctx.fillText('Listening with Cadenzia', SIZE / 2, SIZE - 90);

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
