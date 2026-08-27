import { useEffect, useState } from 'react';
import { getCategory } from '../utils/tracks';
import { PRICE, PAYMENTS_ENABLED, PRELAUNCH_NOTE } from '../utils/config';
import { useShare } from '../hooks/useShare';
import Artwork from './Artwork';

// Shown when a free listener chooses a piece from the full collection.
//
// This replaces the old daily time gate, and the difference is the whole point:
// nothing is ever interrupted. Whatever is playing keeps playing underneath —
// so this is a small dialog over the music, not a full-screen takeover, and it
// only ever appears because the listener reached for something. There is no
// clock anywhere in the app and no surface that stops the music to ask.
//
// Beneath the offer sits a quiet word-of-mouth invitation, on the same terms as
// before: never a toll, never a condition, framed by the no-ads ethos. It is
// offered here because someone reaching for more music is someone enjoying it.
export default function PremiumInvite({ open, track, onClose, onSubscribe }) {
  const [showLinks, setShowLinks] = useState(false);
  const { share, shareTo, canNativeShare, busy } = useShare();

  useEffect(() => {
    if (open) setShowLinks(false);
  }, [open]);

  if (!open) return null;

  const category = track ? getCategory(track.categoryId) : null;

  const nativeShare = async () => {
    await share(track ? { seed: track.seed, style: category?.style } : {});
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/30 p-4 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="panel w-full max-w-md p-8 text-center"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="The full collection"
      >
        {track && (
          <Artwork
            seed={track.seed}
            style={category?.style}
            size={320}
            animate={false}
            className="mx-auto mb-6 w-24 border border-line"
          />
        )}

        <h2 className="text-h2 text-ink">
          {track ? <span className="font-display italic">{track.name}</span> : 'This piece'} is part
          of the full collection.
        </h2>
        <p className="mx-auto mt-4 text-sm leading-relaxed text-ink-soft">
          Every piece is played and recorded by hand, and a new one is added regularly. Subscribing
          opens the whole library — and everything recorded from here on.
        </p>

        {PAYMENTS_ENABLED && (
          <div className="mt-6 flex items-baseline justify-center gap-2 border-y border-line py-4">
            <span className="font-display text-4xl font-light text-ink">${PRICE.amount}</span>
            <span className="text-ink-soft">/ month</span>
          </div>
        )}

        {PAYMENTS_ENABLED ? (
          <button type="button" onClick={onSubscribe} className="btn-primary mt-6 w-full">
            Open the full collection
          </button>
        ) : (
          <p className="mt-6 rounded-lg border border-line bg-paper-wash px-4 py-3 text-sm text-ink-soft">
            {PRELAUNCH_NOTE}
          </p>
        )}

        <button
          type="button"
          onClick={onClose}
          className="mt-5 text-label text-ink-soft hover:text-ink"
        >
          Not now — keep listening
        </button>

        {/* The word-of-mouth invitation. Decoupled from the offer: declining
            above costs nothing, and nothing here is a condition of anything. */}
        <div className="mt-8 border-t border-line pt-6">
          <p className="text-caption mx-auto max-w-xs">
            Or, if it's earned a place in your day: Cadenzia has no ads, so it only reaches the next
            person when someone passes it on.
          </p>
          {canNativeShare ? (
            <button
              type="button"
              disabled={busy}
              onClick={nativeShare}
              className="btn-ghost mt-4 px-5 py-2 text-sm disabled:opacity-50"
            >
              {busy ? 'Opening…' : 'Share Cadenzia'}
            </button>
          ) : showLinks ? (
            <div className="mx-auto mt-4 grid max-w-xs grid-cols-3 gap-2">
              {[
                ['x', 'X'],
                ['linkedin', 'LinkedIn'],
                ['facebook', 'Facebook'],
              ].map(([id, lbl]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => shareTo(id)}
                  className="btn-ghost px-2 py-2 text-sm"
                >
                  {lbl}
                </button>
              ))}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowLinks(true)}
              className="btn-ghost mt-4 px-5 py-2 text-sm"
            >
              Share Cadenzia
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
