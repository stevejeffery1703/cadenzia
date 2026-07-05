import { getCategory } from '../utils/tracks';
import { useShare } from '../hooks/useShare';
import { PRICE } from '../utils/config';
import Artwork from './Artwork';

// The one-hour moment. A calm interstitial, not a popup — same visual language as
// everything else. Two paths of equal weight: share to continue, or subscribe for
// uninterrupted sessions. Neither is a punishment; neither is a forced upsell.
export default function ShareInterstitial({ open, track, onClose, onUnlocked, onSubscribe }) {
  const { shareNative, shareTo, canNativeShare, busy, error } = useShare({ onUnlocked });
  if (!open) return null;

  const category = track ? getCategory(track.categoryId) : null;

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

        <h2 className="text-h2 text-ink">You have been listening for an hour.</h2>
        <p className="mx-auto mt-4 max-w-md text-ink-soft">
          Share Cadenzia to continue this session, or subscribe for uninterrupted listening.
        </p>

        <div className="mt-10 grid gap-4 text-left sm:grid-cols-2">
          {/* Share */}
          <div className="panel flex flex-col p-6">
            <h3 className="font-display text-xl text-ink">Share to continue</h3>
            <p className="mt-2 flex-1 text-sm text-ink-soft">
              Send the artwork to someone who would appreciate it. This session continues right away.
            </p>
            {canNativeShare ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => shareNative(track)}
                className="btn-ghost mt-5 w-full disabled:opacity-50"
              >
                {busy ? 'Opening…' : 'Share'}
              </button>
            ) : (
              <div className="mt-5 grid grid-cols-3 gap-2">
                {[
                  ['x', 'X'],
                  ['linkedin', 'LinkedIn'],
                  ['facebook', 'Facebook'],
                ].map(([id, label]) => (
                  <button key={id} type="button" onClick={() => shareTo(id)} className="btn-ghost px-2 py-2.5">
                    {label}
                  </button>
                ))}
              </div>
            )}
            {error && <p className="mt-3 text-sm text-warm">{error}</p>}
          </div>

          {/* Subscribe */}
          <div className="panel flex flex-col p-6">
            <h3 className="font-display text-xl text-ink">Subscribe</h3>
            <p className="mt-2 flex-1 text-sm text-ink-soft">
              No interruptions, and downloads that stay with you. {PRICE.label}.
            </p>
            <button type="button" onClick={onSubscribe} className="btn-ghost mt-5 w-full">
              Subscribe — {PRICE.label}
            </button>
          </div>
        </div>

        <button type="button" onClick={onClose} className="mt-8 text-label text-ink-soft hover:text-ink">
          Not now
        </button>
      </div>
    </div>
  );
}
