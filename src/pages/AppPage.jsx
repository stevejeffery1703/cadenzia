import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getCategory } from '../utils/tracks';
import { useAudio, formatTime } from '../hooks/useAudio';
import { useSession } from '../hooks/useSession';
import { recordPlay } from '../utils/plays';
import { recordSession } from '../utils/sessions';
import Library from '../components/Library';
import Player from '../components/Player';
import ShareInterstitial from '../components/ShareInterstitial';
import SubscribeModal from '../components/SubscribeModal';

// The player. Library on the left, now-playing in the centre, session on the
// right. The one-hour free gate surfaces as a calm interstitial — never a wall,
// never mid-track beyond the natural pause.
export default function AppPage({ subscription }) {
  const { isSubscriber, user } = subscription;
  const [showGate, setShowGate] = useState(false);
  const [showSubscribe, setShowSubscribe] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [params, setParams] = useSearchParams();

  const session = useSession({ isSubscriber });

  const audio = useAudio({
    onTick: () => {
      if (!isSubscriber) session.addSecond();
    },
    onTrackComplete: (track) => {
      recordPlay();
      if (user) {
        recordSession({
          trackId: track.id,
          trackName: track.name,
          durationSeconds: track.durationSeconds,
        });
      }
    },
  });

  // Deep link ?subscribe=1 opens checkout (from nav + pricing CTAs).
  useEffect(() => {
    if (params.get('subscribe') === '1') {
      setShowSubscribe(true);
      params.delete('subscribe');
      setParams(params, { replace: true });
    }
  }, [params, setParams]);

  // Cross the hour → pause at the next second and offer the calm choice.
  useEffect(() => {
    if (session.gateReached && audio.playing) {
      audio.pause();
      setShowGate(true);
    }
  }, [session.gateReached, audio.playing, audio]);

  const handlePlay = (track) => {
    if (session.gateReached) {
      setShowGate(true);
      return;
    }
    audio.loadTrack(track, { autoplay: true });
    setLibraryOpen(false);
  };

  const category = audio.track ? getCategory(audio.track.categoryId) : null;

  return (
    <main className="page-enter mx-auto max-w-content px-6 pb-28 pt-8 lg:pb-12">
      <div className="grid gap-10 lg:grid-cols-[300px_1fr_260px]">
        {/* Library — left on desktop, bottom sheet on mobile. */}
        <aside className="hidden lg:block">
          <Library currentTrackId={audio.track?.id} onPlay={handlePlay} />
        </aside>

        <Player audio={audio} isSubscriber={isSubscriber} />

        {/* Session — right on desktop only. */}
        <aside className="hidden lg:block">
          <SessionPanel audio={audio} session={session} category={category} isSubscriber={isSubscriber} />
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
            <Library currentTrackId={audio.track?.id} onPlay={handlePlay} />
          </div>
        </div>
      )}

      <ShareInterstitial
        open={showGate}
        track={audio.track}
        onClose={() => setShowGate(false)}
        onUnlocked={() => {
          session.unlockSession();
          setShowGate(false);
        }}
        onSubscribe={() => {
          setShowGate(false);
          setShowSubscribe(true);
        }}
      />

      <SubscribeModal open={showSubscribe} onClose={() => setShowSubscribe(false)} />
    </main>
  );
}

// Quiet session readout. Current piece, time in session, and an optional notes
// field — no gamification, no streaks.
function SessionPanel({ audio, session, category, isSubscriber }) {
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
        {!isSubscriber && (
          <p className="text-caption mt-1">
            {session.minutesRemaining > 0
              ? `${session.minutesRemaining} min of open listening left`
              : 'Share to continue this session'}
          </p>
        )}
      </div>

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
