import { CATEGORIES, tracksByCategory, canPlay } from '../utils/tracks';
import Artwork from './Artwork';

// The library — every piece, organised by category. Doubles as track detail:
// each row carries the artwork, the title and its description. Selecting a row
// plays it and shows its full artwork in the now-playing surface.
//
// Pieces outside the free collection stay visible and selectable — choosing one
// opens the invitation rather than doing nothing, and never interrupts whatever
// is currently playing. They're marked with a quiet dot, not a padlock: this is
// a collection you haven't opened yet, not a thing being withheld.
export default function Library({ currentTrackId, onPlay, isSubscriber = false }) {
  return (
    <div className="space-y-9">
      {CATEGORIES.map((category) => (
        <section key={category.id}>
          <header className="mb-3">
            <h2 className="font-display text-xl font-normal text-ink">{category.name}</h2>
            <p className="text-caption italic">{category.tagline}</p>
          </header>
          <ul className="space-y-1">
            {tracksByCategory(category.id).map((track) => {
              const active = track.id === currentTrackId;
              const locked = !canPlay(track, isSubscriber);
              return (
                <li key={track.id}>
                  <button
                    type="button"
                    onClick={() => onPlay(track)}
                    className={`flex w-full items-center gap-3 rounded-lg border px-2.5 py-2 text-left transition-colors ${
                      active
                        ? 'border-accent/40 bg-paper-wash'
                        : 'border-transparent hover:border-line hover:bg-paper-wash/60'
                    }`}
                  >
                    <Artwork
                      seed={track.seed}
                      style={category.style}
                      size={120}
                      animate={false}
                      rounded="rounded-md"
                      className={`h-14 w-14 shrink-0 border border-line ${
                        locked ? 'opacity-60' : ''
                      }`}
                    />
                    <span className="min-w-0 flex-1">
                      <span
                        className={`block truncate font-display text-lg italic ${
                          active ? 'text-accent' : locked ? 'text-ink-soft' : 'text-ink'
                        }`}
                      >
                        {track.name}
                      </span>
                      {/* Wraps rather than truncating — the description is how
                          you choose a piece, so it has to be readable in full.
                          Rows vary in height by a line as a result, which is
                          fine for a library list. Keep descriptions short enough
                          in tracks.js that this stays to two or three lines. */}
                      <span className="text-caption block">{track.description}</span>
                    </span>
                    {active ? <PlayingDot /> : locked ? <CollectionDot /> : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}

function PlayingDot() {
  return <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden />;
}

// Part of the full collection. An open ring, not a padlock.
function CollectionDot() {
  return (
    <span
      className="h-1.5 w-1.5 shrink-0 rounded-full border border-ink-soft"
      title="Part of the full collection"
    />
  );
}
