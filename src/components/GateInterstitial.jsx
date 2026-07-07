import { getCategory } from '../utils/tracks';
import { PRICE, FREE_DAILY_MINUTES } from '../utils/config';
import Artwork from './Artwork';

// The daily gate. Once a day, when the free hour is used up, a calm interstitial
// — not a wall. What it leads with depends on who's hit it:
//   • A listener WITHOUT an account hasn't had their free first week yet, so it's
//     led with — creating an account is strictly better for them than paying or
//     stopping. Subscribe becomes a quiet link.
//   • A signed-in listener has already had that week, so they get the honest
//     subscribe/continue choice.
// Sharing lives elsewhere, on positive surfaces — asking for it here would be the
// wrong moment.
export default function GateInterstitial({
  open,
  track,
  isSignedIn = false,
  minutes = FREE_DAILY_MINUTES,
  onClose,
  onContinue,
  onSubscribe,
  onStartFreeWeek,
}) {
  if (!open) return null;

  const category = track ? getCategory(track.categoryId) : null;
  const label = minutes === 60 ? 'hour' : `${minutes} minutes`;

  // The soft, honest escape — identical in both versions.
  const continueCard = (
    <div className="panel flex flex-col p-6">
      <h3 className="font-display text-xl text-ink">Continue free today</h3>
      <p className="mt-2 flex-1 text-sm text-ink-soft">
        Keep this session going — no charge, nothing to share. The limit simply resets tomorrow.
      </p>
      <button type="button" onClick={onContinue} className="btn-ghost mt-5 w-full">
        Continue free
      </button>
    </div>
  );

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

        <h2 className="text-h2 text-ink">That's your free {label} for today.</h2>

        {isSignedIn ? (
          <>
            <p className="mx-auto mt-4 max-w-md text-ink-soft">
              Subscribe for uninterrupted focus and offline downloads — or keep listening free for
              the rest of today. Your free {label} returns tomorrow.
            </p>

            <div className="mt-10 grid gap-4 text-left sm:grid-cols-2">
              <div className="panel flex flex-col p-6">
                <h3 className="font-display text-xl text-ink">Subscribe</h3>
                <p className="mt-2 flex-1 text-sm text-ink-soft">
                  Uninterrupted focus, and every track offline. {PRICE.label}.
                </p>
                <button type="button" onClick={onSubscribe} className="btn-primary mt-5 w-full">
                  Subscribe — {PRICE.label}
                </button>
              </div>
              {continueCard}
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
            <p className="mx-auto mt-4 max-w-md text-ink-soft">
              Create a free account and your first week is Premium — no daily limit, and every track
              downloads. Or keep listening free for the rest of today.
            </p>

            <div className="mt-10 grid gap-4 text-left sm:grid-cols-2">
              <div className="panel flex flex-col p-6">
                <h3 className="font-display text-xl text-ink">Your first week, free</h3>
                <p className="mt-2 flex-1 text-sm text-ink-soft">
                  Create a free account and get 7 days of Premium — no daily limit, and every track
                  downloads.
                </p>
                <button
                  type="button"
                  onClick={onStartFreeWeek}
                  className="btn-primary mt-5 w-full"
                >
                  Create a free account
                </button>
              </div>
              {continueCard}
            </div>

            <p className="mt-8 text-sm text-ink-soft">
              Rather go straight to unlimited?{' '}
              <button
                type="button"
                onClick={onSubscribe}
                className="text-accent underline-offset-2 hover:underline"
              >
                Subscribe — {PRICE.short}
              </button>
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-4 text-label text-ink-soft hover:text-ink"
            >
              Not now
            </button>
          </>
        )}
      </div>
    </div>
  );
}
