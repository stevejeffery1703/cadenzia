// Generative track artwork.
//
// Each track's artwork is a small, serious composition produced deterministically
// from its `seed` (the track id) — always identical for a given track, never
// hand-drawn. The language is fine ink line-work on warm paper, like an engraving
// or a page of liner notes, and it carries the brand motif throughout: notes,
// sound waves, and wavy lines. Five visual languages, one per category:
//
//   depth        Deep Focus        — concentric depth contours over a warm glow
//   thread       Flow State        — one continuous flowing wave
//   constellation Creative Thinking — scattered notes connected by thin arcs
//   candlelight  Restoration       — diffuse warm washes, barely a line
//   score        Activation        — precise staff lines, a score abstracted
//
// Output is an SVG string. The same string powers the on-screen artwork and the
// PNG rendered into share cards, so palette values are inlined (no CSS vars).

const PALETTE = {
  paper: '#F5F1E8',
  paperRaised: '#FCFAF4',
  paperDeep: '#EDE7D9',
  ink: '#232019',
  inkSoft: '#6B6358',
  line: '#E3DCCD',
  accent: '#2F4A3C',
  accentBright: '#3E624F',
  warm: '#C2773F',
};

// Deterministic PRNG seeded from a string (mulberry32 over an xfnv1a hash).
function makeRng(seedStr) {
  let h = 1779033703 ^ seedStr.length;
  for (let i = 0; i < seedStr.length; i++) {
    h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return function rng() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const round = (n) => Math.round(n * 100) / 100;

// ---- Visual languages -------------------------------------------------------

function depth(rng, W, H, animate) {
  const cx = round(W * (0.42 + rng() * 0.16));
  const cy = round(H * (0.54 + rng() * 0.14));
  const rings = 13 + Math.floor(rng() * 5);
  const maxR = W * 0.64;

  const lines = [];
  for (let i = rings; i >= 1; i--) {
    const t = i / rings;
    const baseR = maxR * t;
    const amp = baseR * (0.03 + rng() * 0.05);
    const phase = rng() * Math.PI * 2;
    const k = 2 + Math.floor(rng() * 3);
    const N = 72;
    let d = '';
    for (let j = 0; j <= N; j++) {
      const ang = (j / N) * Math.PI * 2;
      const r = baseR + amp * Math.sin(k * ang + phase);
      const x = round(cx + Math.cos(ang) * r);
      const y = round(cy + Math.sin(ang) * r * 0.9);
      d += `${j === 0 ? 'M' : 'L'} ${x} ${y} `;
    }
    const op = round(0.05 + (1 - t) * 0.32);
    lines.push(
      `<path d="${d}Z" fill="none" stroke="${PALETTE.ink}" stroke-width="${round(0.5 + (1 - t) * 0.5)}" opacity="${op}"/>`
    );
  }

  const drift = animate
    ? `<animateTransform attributeName="transform" type="translate" values="0 0; 0 ${round(H * 0.012)}; 0 0" dur="50s" repeatCount="indefinite"/>`
    : '';

  return {
    defs: `<radialGradient id="warmglow" cx="${round((cx / W) * 100)}%" cy="${round((cy / H) * 100)}%" r="42%">
      <stop offset="0%" stop-color="${PALETTE.warm}" stop-opacity="0.2"/>
      <stop offset="100%" stop-color="${PALETTE.warm}" stop-opacity="0"/>
    </radialGradient>`,
    body: `      <rect width="${W}" height="${H}" fill="url(#warmglow)"/>
      <g>${drift}${lines.join('')}</g>`,
  };
}

function thread(rng, W, H, animate) {
  const midY = H * (0.4 + rng() * 0.2);
  const amp = H * (0.12 + rng() * 0.1);
  const segs = 3 + Math.floor(rng() * 2);

  const wave = (offY, a) => {
    const step = (W * 1.12) / segs;
    let x = -W * 0.06;
    let d = `M ${round(x)} ${round(midY + offY)}`;
    for (let i = 0; i < segs; i++) {
      const cxp = x + step / 2;
      const cyp = midY + offY + (i % 2 === 0 ? -a : a) * 2;
      const nx = x + step;
      d += ` Q ${round(cxp)} ${round(cyp)} ${round(nx)} ${round(midY + offY)}`;
      x = nx;
    }
    return d;
  };

  const drift = animate
    ? `<animateTransform attributeName="transform" type="translate" values="0 0; 0 ${round(H * 0.02)}; 0 0" dur="40s" repeatCount="indefinite"/>`
    : '';

  return {
    defs: '',
    body: `      <g>${drift}
        <path d="${wave(H * 0.07, amp * 0.8)}" fill="none" stroke="${PALETTE.ink}" stroke-width="1" opacity="0.12"/>
        <path d="${wave(-H * 0.06, amp * 0.9)}" fill="none" stroke="${PALETTE.warm}" stroke-width="1.2" opacity="0.22"/>
        <path d="${wave(0, amp)}" fill="none" stroke="${PALETTE.accent}" stroke-width="${round(2.2 + rng())}" stroke-linecap="round"/>
      </g>`,
  };
}

function constellation(rng, W, H, animate) {
  const n = 9 + Math.floor(rng() * 5);
  const pad = W * 0.14;
  const pts = Array.from({ length: n }, () => ({
    x: round(pad + rng() * (W - pad * 2)),
    y: round(pad + rng() * (H - pad * 2)),
    r: round(2 + rng() * 2.4),
    accent: rng() > 0.7,
    stem: rng() > 0.62,
  }));

  // Connect each point to its nearest neighbour or two — arcs, not a network.
  const seen = new Set();
  const arcs = [];
  pts.forEach((p, i) => {
    const near = pts
      .map((q, j) => ({ j, d: Math.hypot(p.x - q.x, p.y - q.y) }))
      .filter((o) => o.j !== i)
      .sort((a, b) => a.d - b.d)
      .slice(0, 1 + Math.floor(rng() * 2));
    near.forEach(({ j }) => {
      const key = i < j ? `${i}-${j}` : `${j}-${i}`;
      if (seen.has(key)) return;
      seen.add(key);
      const q = pts[j];
      const mx = (p.x + q.x) / 2 + (rng() - 0.5) * 36;
      const my = (p.y + q.y) / 2 + (rng() - 0.5) * 36;
      arcs.push(
        `<path d="M ${p.x} ${p.y} Q ${round(mx)} ${round(my)} ${q.x} ${q.y}" fill="none" stroke="${PALETTE.ink}" stroke-width="0.7" opacity="${round(0.1 + rng() * 0.14)}"/>`
      );
    });
  });

  const notes = pts
    .map((p) => {
      const colour = p.accent ? PALETTE.accent : PALETTE.ink;
      const stem = p.stem
        ? `<path d="M ${round(p.x + p.r * 0.9)} ${round(p.y)} V ${round(p.y - p.r * 4.5)}" stroke="${colour}" stroke-width="0.9" stroke-linecap="round" opacity="0.7"/>`
        : '';
      const pulse = animate
        ? `<animate attributeName="opacity" values="${round(0.6 + rng() * 0.3)};1;${round(0.6 + rng() * 0.3)}" dur="${round(8 + rng() * 6)}s" begin="${round(rng() * 5)}s" repeatCount="indefinite"/>`
        : '';
      return `<g>${stem}<ellipse cx="${p.x}" cy="${p.y}" rx="${p.r}" ry="${round(p.r * 0.82)}" transform="rotate(-20 ${p.x} ${p.y})" fill="${colour}">${pulse}</ellipse></g>`;
    })
    .join('');

  return {
    defs: '',
    body: `<rect width="${W}" height="${H}" fill="url(#pbg)"/>${arcs.join('')}${notes}`,
  };
}

function candlelight(rng, W, H, animate) {
  const blobs = Array.from({ length: 4 + Math.floor(rng() * 2) }, (_, i) => {
    const x = round(W * (0.15 + rng() * 0.7));
    const y = round(H * (0.15 + rng() * 0.7));
    const r = round(W * (0.3 + rng() * 0.3));
    const warm = i % 3 === 0 ? PALETTE.paperRaised : PALETTE.warm;
    const o = i % 3 === 0 ? round(0.5 + rng() * 0.2) : round(0.12 + rng() * 0.1);
    const drift = animate
      ? `<animateTransform attributeName="transform" type="translate" values="0 0; ${round((rng() - 0.5) * W * 0.07)} ${round((rng() - 0.5) * H * 0.07)}; 0 0" dur="${round(52 + rng() * 14)}s" repeatCount="indefinite"/>`
      : '';
    return `<g>${drift}<circle cx="${x}" cy="${y}" r="${r}" fill="${warm}" opacity="${o}" filter="url(#soft)"/></g>`;
  }).join('');

  // One faint wavy line drifting through the warmth.
  const ly = round(H * (0.4 + rng() * 0.2));
  const faintWave = `<path d="M ${round(-W * 0.05)} ${ly} Q ${round(W * 0.3)} ${round(ly - H * 0.08)} ${round(W * 0.55)} ${ly} T ${round(W * 1.05)} ${ly}" fill="none" stroke="${PALETTE.warm}" stroke-width="1" opacity="0.18"/>`;

  return {
    defs: '',
    body: `<rect width="${W}" height="${H}" fill="url(#pbg)"/>${blobs}${faintWave}`,
  };
}

function score(rng, W, H, animate) {
  const staves = 3 + Math.floor(rng() * 2);
  const groupGap = (H * 0.62) / staves;
  const top = H * 0.2;
  const lineGap = round(H * 0.016);
  const elems = [];

  for (let s = 0; s < staves; s++) {
    const gy = top + groupGap * s;
    const x1 = round(W * (0.1 + rng() * 0.12));
    const x2 = round(W * (0.62 + rng() * 0.28));
    for (let l = 0; l < 5; l++) {
      const y = round(gy + l * lineGap);
      elems.push(
        `<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="${PALETTE.ink}" stroke-width="0.7" opacity="0.28"/>`
      );
    }
    // A few note-heads sitting on the staff.
    const noteCount = 2 + Math.floor(rng() * 3);
    for (let nidx = 0; nidx < noteCount; nidx++) {
      const nx = round(x1 + (x2 - x1) * (0.15 + rng() * 0.75));
      const ny = round(gy + Math.floor(rng() * 5) * lineGap);
      const accent = s === staves - 1 && nidx === 0;
      const pulse =
        accent && animate
          ? `<animate attributeName="opacity" values="0.55;1;0.55" dur="9s" repeatCount="indefinite"/>`
          : '';
      elems.push(
        `<ellipse cx="${nx}" cy="${ny}" rx="3" ry="2.4" transform="rotate(-20 ${nx} ${ny})" fill="${accent ? PALETTE.accent : PALETTE.ink}" opacity="${accent ? 0.95 : round(0.5 + rng() * 0.3)}">${pulse}</ellipse>`
      );
    }
  }

  // Two faint bar-lines for structure.
  const bars = [W * (0.34 + rng() * 0.08), W * (0.64 + rng() * 0.08)]
    .map(
      (bx) =>
        `<line x1="${round(bx)}" y1="${round(top - H * 0.02)}" x2="${round(bx)}" y2="${round(top + groupGap * (staves - 1) + lineGap * 4 + H * 0.02)}" stroke="${PALETTE.inkSoft}" stroke-width="0.6" opacity="0.16"/>`
    )
    .join('');

  return {
    defs: '',
    body: `<rect width="${W}" height="${H}" fill="url(#pbg)"/>${bars}${elems.join('')}`,
  };
}

const STYLES = { depth, thread, constellation, candlelight, score };

// ---- Assembly ---------------------------------------------------------------

export function artworkSVG({ seed, style, width = 640, height = 640, animate = true }) {
  const rng = makeRng(`${style}:${seed}`);
  const draw = STYLES[style] || depth;
  const { defs, body } = draw(rng, width, height, animate);

  // Shared defs: warm paper background, a soft-blur filter, a faint centre lift.
  return `<svg viewBox="0 0 ${width} ${height}" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" role="img">
  <defs>
    <linearGradient id="pbg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${PALETTE.paperRaised}"/>
      <stop offset="100%" stop-color="${PALETTE.paperDeep}"/>
    </linearGradient>
    <radialGradient id="lift" cx="50%" cy="46%" r="60%">
      <stop offset="0%" stop-color="${PALETTE.paperRaised}" stop-opacity="0.6"/>
      <stop offset="100%" stop-color="${PALETTE.paperRaised}" stop-opacity="0"/>
    </radialGradient>
    <filter id="soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${round(width * 0.05)}"/></filter>
    ${defs}
  </defs>
  <rect width="${width}" height="${height}" fill="url(#pbg)"/>
  <rect width="${width}" height="${height}" fill="url(#lift)"/>
  ${body}
</svg>`;
}

// Render an artwork to a PNG data URL (used for share cards). Static — no motion.
export function svgToPngDataUrl(svgString, size = 1080) {
  return new Promise((resolve, reject) => {
    const svg64 = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString)));
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, size, size);
      resolve({ canvas, dataUrl: canvas.toDataURL('image/png') });
    };
    img.onerror = reject;
    img.src = svg64;
  });
}
