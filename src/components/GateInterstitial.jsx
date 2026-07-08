import { useEffect, useState } from 'react';
import { getCategory } from '../utils/tracks';
import { PRICE, FREE_DAILY_MINUTES } from '../utils/config';
import { useShare } from '../hooks/useShare';
import Artwork from './Artwork';

// The daily gate. Once a day, when the free hour is used up, a calm interstitial
// — not a wall. Two honest choices: subscribe, or keep listening free for the
// rest of today. Continuing is unconditional.
//
// Only AFTER they choose to continue — the relieved, "they're on my side" moment
// — do we offer a word-of-mouth invitation, and it's fully decoupled from the
// choice: never a toll, framed as "we have no ads, so we only reach the next
// person when you pass it on." It appears at most once a day, because the gate
// itself only fires once (the rest of the day is then unlocked).
export default function GateInterstitial({
  open,
  track,
  minutes = FREE_DAILY_MINUTES,
  onClose,
  onContinue,
  onSubscribe,
}) {
  const [phase, setPhase] = useState('choose'); // 'choose' | 'share'
  const [showLinks, setShowLinks] = useState(false);
  const { share, shareTo, canNativeShare, busy } = useShare();

  // Fresh state each time the gate opens.
  useEffect(() => {
    if (open) {
      setPhase('choose');
      setShowLinks(false);
    }
  }, [open]);

  if (!open) return null;

  const category = track ? getCategory(track.categoryId) : null;
  const label = minutes === 60 ? 'hour' : `${minutes} minutes`;
  const cardProps = track ? { seed: track.seed, style: category?.style } : {};

  const handleContinue = () => {
    onContinue?.(); // unlock the rest of today + resume the music underneath
    setPhase('share'); // stay on the same calm surface for the invitation
  };

  const nativeShare = async () => {
    const ok = await share(cardProps);
    if (ok) onClose?.(); // sharing dismisses the gate back to the player
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-paper px-6 page-enter">
      <div className="w-full max-w-2xl text-center">
        {track && (
          <Artwork
            seed={track.seed}
            style={category?.style}
            size={320}
            animate={false}
            className="mx-auto mb-8 w-28 border border-line"
          />
        )}

        {phase === 'choose' ? (
          <>
            <h2 className="text-h2 text-ink">That's your free {label} for today.</h2>
            <p className="mx-auto mt-4 max-w-md text-ink-soft">
              Subscribe for uninterrupted focus, all day — or keep listening free for the rest of
              today. Your free {label} returns tomorrow.
            </p>

            <div className="mt-10 grid gap-4 text-left sm:grid-cols-2">
              <div className="panel flex flex-col p-6">
                <h3 className="font-display text-xl text-ink">Subscribe</h3>
                <p className="mt-2 flex-1 text-sm text-ink-soft">
                  No daily limit, ever — focus for as long as you work. {PRICE.label}.
                </p>
                <button type="button" onClick={onSubscribe} className="btn-primary mt-5 w-full">
                  Subscribe — {PRICE.label}
                </button>
              </div>

              <div className="panel flex flex-col p-6">
                <h3 className="font-display text-xl text-ink">Continue free today</h3>
                <p className="mt-2 flex-1 text-sm text-ink-soft">
                  Keep listening for as long as you like today — no charge, and we won't ask again
                  until tomorrow.
                </p>
                <button type="button" onClick={handleContinue} className="btn-ghost mt-5 w-full">
                  Continue free
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="mt-8 text-label text-ink-soft hover:text-ink"
            >
              Not now
            </button>
          </>
        ) : (
          <>
            <h2 className="text-h2 text-ink">You're set for the rest of today.</h2>
            <p className="mx-auto mt-4 max-w-md text-ink-soft">
              One thing before you go back to it: Cadenzia has no ads — it reaches the next person
              who needs it only when someone passes it on. If it's earned a place in your day, send
              it to a friend who'd focus better for it.
            </p>

            {canNativeShare ? (
              <button
                type="button"
                disabled={busy}
                onClick={nativeShare}
                className="btn-primary mt-8 disabled:opacity-50"
              >
                {busy ? 'Opening…' : 'Share Cadenzia'}
              </button>
            ) : showLinks ? (
              <div className="mx-auto mt-8 grid max-w-xs grid-cols-3 gap-2">
                {[
                  ['x', 'X'],
                  ['linkedin', 'LinkedIn'],
                  ['facebook', 'Facebook'],
                ].map(([id, lbl]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => shareTo(id)}
                    className="btn-ghost px-2 py-2.5 text-sm"
                  >
                    {lbl}
                  </button>
                ))}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowLinks(true)}
                className="btn-primary mt-8"
              >
                Share Cadenzia
              </button>
            )}

            <div className="mt-8">
              <button
                type="button"
                onClick={onClose}
                className="text-label text-ink-soft hover:text-ink"
              >
                Back to listening
              </button>
            </div>
            <p className="text-caption mt-6">That's the only time we'll ask today.</p>
          </>
        )}
      </div>
    </div>
  );
}
