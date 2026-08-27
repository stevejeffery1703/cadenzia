import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getCategory, canPlay } from '../utils/tracks';
import { APP_NAME, PAYMENTS_ENABLED } from '../utils/config';
import { useAudio, formatTime } from '../hooks/useAudio';
import { useFocusStats } from '../hooks/useFocusStats';
import { recordPlay } from '../utils/plays';
import { useDocumentHead } from '../hooks/useDocumentHead';
import Library from '../components/Library';
import Player from '../components/Player';
import FocusShare from '../components/FocusShare';
import PremiumInvite from '../components/PremiumInvite';
import SubscribeModal from '../components/SubscribeModal';

// The player. Library on the left, now-playing in the centre, session on the
// right.
//
// Nothing in here interrupts the music. There is no clock, no daily limit and no
// surface that stops playback to ask for anything: once a piece is playing it
// plays, and auto-advance only ever moves to another piece the listener can
// play. The paid tier is the size of the library, not the length of the session
// — so the only prompt is the one a listener triggers by reaching for a piece
// from the full collection, and even that leaves the music running underneath.
export default function AppPage({ subscription }) {
  useDocumentHead('/app');
  const { isSubscriber } = subscription;
  const [invite, setInvite] = useState(null); // the locked piece they reached for
  const [showSubscribe, setShowSubscribe] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [params, setParams] = useSearchParams();

  const focus = useFocusStats();

  const audio = useAudio({
    isSubscriber,
    onTick: (_, track) => {
      if (track) focus.addSecond(track.categoryId);
    },
    onTrackComplete: () => {
      recordPlay();
    },
  });

  // Deep link ?subscribe=1 opens checkout (from nav + pricing CTAs). Ignored
  // while payments are off, so a stale or shared link can't surface a payment
  // flow we can't honour — the server refuses checkout anyway (503).
  useEffect(() => {
    if (params.get('subscribe') === '1') {
      if (PAYMENTS_ENABLED) setShowSubscribe(true);
      params.delete('subscribe');
      setParams(params, { replace: true });
    }
  }, [params, setParams]);

  const handlePlay = (track) => {
    // Reaching for a piece from the full collection opens the invitation — and
    // deliberately does NOT touch playback. Whatever is playing keeps playing.
    if (!canPlay(track, isSubscriber)) {
      setInvite(track);
      return;
    }
    audio.loadTrack(track, { autoplay: true });
    setLibraryOpen(false);
  };

  const category = audio.track ? getCategory(audio.track.categoryId) : null;

  return (
    <main className="page-enter mx-auto max-w-content px-6 pb-28 pt-8 lg:pb-12">
      {/* Stable page identity — the visible content is the artwork/player, not
          a heading, but the page still needs one real h1 that doesn't change
          every time a track is picked or skipped (see Player.jsx's h2). */}
      <h1 className="sr-only">Listen — {APP_NAME}</h1>
      <div className="grid gap-10 lg:grid-cols-[300px_1fr_260px]">
        {/* Library — left on desktop, bottom sheet on mobile. */}
        <aside className="hidden lg:block">
          <Library
            currentTrackId={audio.track?.id}
            onPlay={handlePlay}
            isSubscriber={isSubscriber}
          />
        </aside>

        <Player audio={audio} onResume={handlePlay} />

        {/* Session — right on desktop only. */}
        <aside className="hidden lg:block">
          <SessionPanel audio={audio} focus={focus} category={category} />
        </aside>
      </div>

      {/* Mobile: open the library. */}
      <button
        type="button"
        onClick={() => setLibraryOpen(true)}
        className="btn-ghost fixed inset-x-6 bottom-6 z-30 justify-center bg-paper/90 backdrop-blur lg:hidden"
        style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
      >
        Library
      </button>

      {libraryOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setLibraryOpen(false)}>
          <div className="absolute inset-0 bg-ink/20 backdrop-blur-sm" />
          <div
            className="absolute inset-x-0 bottom-0 max-h-[80vh] overflow-y-auto rounded-t-2xl border-t border-line bg-paper-raised p-6 pb-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-line" />
            <Library
              currentTrackId={audio.track?.id}
              onPlay={handlePlay}
              isSubscriber={isSubscriber}
            />
          </div>
        </div>
      )}

      <PremiumInvite
        open={!!invite}
        track={invite}
        onClose={() => setInvite(null)}
        onSubscribe={() => {
          setInvite(null);
          setShowSubscribe(true);
        }}
      />

      <SubscribeModal open={showSubscribe} onClose={() => setShowSubscribe(false)} />
    </main>
  );
}

// Quiet session readout. Current piece, time in session, and an optional notes
// field — no gamification, no streaks, and no countdown.
function SessionPanel({ audio, focus, category }) {
  const [notes, setNotes] = useState(() => localStorage.getItem('cad_notes') || '');
  useEffect(() => {
    localStorage.setItem('cad_notes', notes);
  }, [notes]);

  return (
    <div className="space-y-8 lg:pt-2">
      <div>
        <p className="text-label text-ink-soft">Now</p>
        <p className="mt-2 font-display text-2xl text-ink">
          {category ? category.name : 'Nothing playing'}
        </p>
      </div>

      <div>
        <p className="text-label text-ink-soft">In session</p>
        <p className="mt-2 font-display text-2xl tabular-nums text-ink">{formatTime(audio.elapsed)}</p>
      </div>

      {focus.headline && <FocusShare headline={focus.headline} />}

      <div>
        <label htmlFor="notes" className="text-label text-ink-soft">
          Notes
        </label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={5}
          placeholder="What are you working on?"
          className="mt-2 w-full resize-none rounded-lg border border-line bg-paper-raised px-3 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-accent"
        />
      </div>
    </div>
  );
}
