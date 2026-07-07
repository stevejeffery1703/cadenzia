import { CATEGORIES, tracksByCategory, formatDuration } from '../utils/tracks';
import Artwork from './Artwork';

// The library — every track, organised by category. Doubles as track detail:
// each row carries the artwork, the title, its category, and length. Selecting a
// row plays it and shows its full artwork and description in the now-playing
// surface. Every track is available; listening is gated by time, not by track.
export default function Library({ currentTrackId, onPlay }) {
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
                      className="h-11 w-11 shrink-0 border border-line"
                    />
                    <span className="min-w-0 flex-1">
                      <span
                        className={`block truncate font-display text-lg italic ${
                          active ? 'text-accent' : 'text-ink'
                        }`}
                      >
                        {track.name}
                      </span>
                      <span className="text-caption">
                        {track.loop ? 'Loops seamlessly' : formatDuration(track.durationSeconds)}
                      </span>
                    </span>
                    {active && <PlayingDot />}
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
