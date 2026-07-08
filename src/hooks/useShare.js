import { useCallback, useState } from 'react';
import { APP_NAME, APP_URL } from '../utils/config';
import { buildShareCard } from '../utils/shareCard';

// Sharing the artwork — a quiet achievement ("3 hours of deep focus"), offered on
// positive surfaces, never as a toll at the gate. It's a plain link to Cadenzia
// carrying the artwork card; nothing is tracked and no reward is attached.

function intent(platform, text, url) {
  if (platform === 'x') {
    return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
  }
  if (platform === 'linkedin') {
    return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
  }
  if (platform === 'facebook') {
    return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
  }
  return url;
}

export function useShare() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const canNativeShare =
    typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const caption = (headline) => (headline ? `${headline} — ${APP_NAME}` : APP_NAME);

  // Web Share API path — preferred where available. Carries the artwork card.
  const share = useCallback(async ({ seed, style, headline } = {}) => {
    setBusy(true);
    setError(null);
    try {
      let files;
      try {
        const card = await buildShareCard({ seed, style, headline });
        if (card.file && navigator.canShare && navigator.canShare({ files: [card.file] })) {
          files = [card.file];
        }
      } catch (err) {
        // Share still proceeds without the image, but the artwork is the actual
        // draw, so a silent failure here is worth knowing about.
        console.error('[useShare] Share-card render failed, sharing without artwork:', err);
      }
      await navigator.share({
        title: APP_NAME,
        text: caption(headline),
        url: APP_URL,
        ...(files ? { files } : {}),
      });
      return true;
    } catch (e) {
      // Cancelling the sheet is a normal choice, not an error to surface.
      if (e && e.name === 'AbortError') return false;
      setError('That share did not open. Try another way below.');
      return false;
    } finally {
      setBusy(false);
    }
  }, []);

  // Platform fallback — open the composer in a new tab (no image attachment;
  // web-intent composers don't accept one).
  const shareTo = useCallback((platform, { headline } = {}) => {
    window.open(intent(platform, caption(headline), APP_URL), '_blank', 'noopener');
    return true;
  }, []);

  return { share, shareTo, canNativeShare, busy, error };
}
