import { useCallback, useState } from 'react';
import { APP_NAME, APP_URL } from '../utils/config';
import { deviceId } from '../utils/api';
import { buildShareCard } from '../utils/shareCard';

// Sharing the artwork — the real growth mechanism. Offered on positive surfaces
// as a quiet achievement ("3 hours of deep focus"), never as a toll at the gate.
//
// The share URL carries a referral tag: a signed-in listener's own referral code
// when available (so a friend who follows it and signs up gets a doubled free
// first week — the sharer gets nothing dangled in return), otherwise an anonymous
// device tag that still attributes the visit but unlocks no reward.

function refUrl(refCode) {
  return `${APP_URL}?ref=${encodeURIComponent(refCode || deviceId())}`;
}

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

export function useShare({ refCode } = {}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const canNativeShare =
    typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const caption = (headline) => (headline ? `${headline} — ${APP_NAME}` : APP_NAME);

  // Web Share API path — preferred where available. Carries the artwork card.
  const share = useCallback(
    async ({ seed, style, headline } = {}) => {
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
          // growth mechanism, so a silent failure here is worth knowing about.
          console.error('[useShare] Share-card render failed, sharing without artwork:', err);
        }
        await navigator.share({
          title: APP_NAME,
          text: caption(headline),
          url: refUrl(refCode),
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
    },
    [refCode]
  );

  // Platform fallback — open the composer in a new tab (no image attachment;
  // web-intent composers don't accept one).
  const shareTo = useCallback(
    (platform, { headline } = {}) => {
      window.open(intent(platform, caption(headline), refUrl(refCode)), '_blank', 'noopener');
      return true;
    },
    [refCode]
  );

  return { share, shareTo, canNativeShare, busy, error };
}
