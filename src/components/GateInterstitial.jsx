import { getCategory } from '../utils/tracks';
import { PRICE, FREE_DAILY_MINUTES } from '../utils/config';
import Artwork from './Artwork';

// The daily gate. Once a day, when the free hour is used up, a calm interstitial
// — not a wall. Two honest choices: subscribe to remove the limit, or keep
// listening free for the rest of today (the limit resets tomorrow). Sharing and
// account creation live elsewhere, on quieter surfaces — pushing either here, at
// a toll, would be the wrong moment.
export default function GateInterstitial({
  open,
  track,
  minutes = FREE_DAILY_MINUTES,
  onClose,
  onContinue,
  onSubscribe,
}) {
  if (!open) return null;

  const category = track ? getCategory(track.categoryId) : null;
  const label = minutes === 60 ? 'hour' : `${minutes} minutes`;

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
        <p className="mx-auto mt-4 max-w-md text-ink-soft">
          Subscribe for uninterrupted focus, all day — or keep listening free for the rest of today.
          Your free {label} returns tomorrow.
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
              Keep this session going — no charge, nothing to share. The limit simply resets tomorrow.
            </p>
            <button type="button" onClick={onContinue} className="btn-ghost mt-5 w-full">
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
      </div>
    </div>
  );
}
