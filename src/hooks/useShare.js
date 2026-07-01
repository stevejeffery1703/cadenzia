import { useCallback, useState } from 'react';
import { APP_NAME, APP_URL } from '../utils/config';
import { deviceId } from '../utils/api';
import { buildShareCard } from '../utils/shareCard';

// Sharing — honor system, by design. We unlock as soon as the share sheet opens
// and never try to verify a post went out. Verified sharing would mean OAuth per
// platform and login friction on the free tier; not worth it for an indie
// product, and the friction would cost more trust than the occasional unearned
// unlock. What makes sharing worth doing is the artwork in the card, not the gate.

const CAPTION = 'Listening with Cadenzia';

function refUrl() {
  return `${APP_URL}?ref=${encodeURIComponent(deviceId())}`;
}

function intent(platform) {
  const url = refUrl();
  const text = CAPTION;
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

export function useShare({ onUnlocked } = {}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const canNativeShare =
    typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  // Web Share API path — preferred where available. Carries the artwork card.
  const shareNative = useCallback(
    async (track) => {
      setBusy(true);
      setError(null);
      try {
        let files;
        try {
          if (track) {
            const card = await buildShareCard(track);
            if (card.file && navigator.canShare && navigator.canShare({ files: [card.file] })) {
              files = [card.file];
            }
          }
        } catch {
          /* card render failed — share without the image */
        }
        await navigator.share({
          title: APP_NAME,
          text: CAPTION,
          url: refUrl(),
          ...(files ? { files } : {}),
        });
        onUnlocked?.(); // honor system — opening the sheet continues the session
        return true;
      } catch (e) {
        // A user cancelling the sheet still counts — we don't punish the choice.
        if (e && e.name === 'AbortError') {
          onUnlocked?.();
          return true;
        }
        setError('That share did not open. Try another way below.');
        return false;
      } finally {
        setBusy(false);
      }
    },
    [onUnlocked]
  );

  // Platform fallback — open the composer in a new tab, then unlock.
  const shareTo = useCallback(
    (platform) => {
      window.open(intent(platform), '_blank', 'noopener');
      onUnlocked?.();
      return true;
    },
    [onUnlocked]
  );

  return { shareNative, shareTo, canNativeShare, busy, error };
}
