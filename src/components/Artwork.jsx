import { useMemo } from 'react';
import { artworkSVG } from '../utils/artwork';

// Renders a track's generated artwork. The SVG carries its own ambient motion
// (a slow gradient/line drift); we strip it when the user prefers reduced motion.
const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function Artwork({ seed, style, size = 640, animate = true, className = '', rounded = 'rounded-md' }) {
  const reduce = prefersReducedMotion();
  const svg = useMemo(
    () => artworkSVG({ seed, style, width: size, height: size, animate: animate && !reduce }),
    [seed, style, size, animate, reduce]
  );

  return (
    <div
      className={`relative aspect-square overflow-hidden ${rounded} ${className}`}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
