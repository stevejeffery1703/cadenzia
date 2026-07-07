import { useState } from 'react';
import { getCategory, tracksByCategory } from '../utils/tracks';
import { useShare } from '../hooks/useShare';

// The achievement share — a positive-surface delighter, not a gate. It shows
// what the listener has actually done today ("3 hours of deep focus") and lets
// them share it as understated art. It appears only once the focus is worth
// celebrating, and asks nothing in return.
export default function FocusShare({ headline, refCode }) {
  const { share, shareTo, canNativeShare, busy, error } = useShare({ refCode });
  const [showLinks, setShowLinks] = useState(false);
  if (!headline) return null;

  const category = getCategory(headline.categoryId);
  // A representative piece of this category's artwork for the card.
  const seed = tracksByCategory(headline.categoryId)[0]?.seed || headline.categoryId;
  const cardProps = { seed, style: category?.style, headline: headline.text };

  return (
    <div>
      <p className="text-label text-ink-soft">Today</p>
      <p className="mt-2 font-display text-xl italic text-ink">{headline.text}</p>

      {canNativeShare ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => share(cardProps)}
          className="btn-ghost mt-3 disabled:opacity-50"
        >
          {busy ? 'Opening…' : 'Share this'}
        </button>
      ) : showLinks ? (
        <div className="mt-3 grid grid-cols-3 gap-2">
          {[
            ['x', 'X'],
            ['linkedin', 'LinkedIn'],
            ['facebook', 'Facebook'],
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => shareTo(id, { headline: headline.text })}
              className="btn-ghost px-2 py-2.5 text-sm"
            >
              {label}
            </button>
          ))}
        </div>
      ) : (
        <button type="button" onClick={() => setShowLinks(true)} className="btn-ghost mt-3">
          Share this
        </button>
      )}

      {error && <p className="mt-2 text-sm text-warm">{error}</p>}
    </div>
  );
}
