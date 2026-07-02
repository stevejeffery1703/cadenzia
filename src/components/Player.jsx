import { useState } from 'react';
import { getCategory } from '../utils/tracks';
import { formatTime } from '../hooks/useAudio';
import { getDownloadLink } from '../utils/download';
import { DOWNLOAD_EXPIRY_DAYS } from '../utils/config';
import Artwork from './Artwork';
import Waveform from './Waveform';

// The now-playing surface — large artwork, title, waveform, and the only
// controls that matter. This is the product; nothing else competes with it.
export default function Player({ audio, isSubscriber }) {
  const { track } = audio;
  const [downloading, setDownloading] = useState(false);

  if (!track) {
    return (
      <section className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <p className="text-h2 text-ink-soft">Choose something to begin.</p>
        <p className="mt-3 max-w-sm text-sm text-ink-faint">
          Put your headphones on. Pick a piece from the library and let the room go quiet.
        </p>
      </section>
    );
  }

  const category = getCategory(track.categoryId);
  const pct = audio.duration ? Math.min(100, (audio.position / audio.duration) * 100) : 0;

  return (
    <section className="flex flex-col items-center text-center">
      <div className="relative w-full max-w-[360px]">
        <Artwork
          seed={track.seed}
          style={category?.style}
          size={720}
          className="breathe w-full border border-line shadow-[0_10px_40px_rgba(35,32,25,0.08)]"
        />
      </div>

      <p className="text-label mt-8 text-accent">{category?.name}</p>
      <h2 className="text-track mt-2 text-3xl text-ink">{track.name}</h2>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-ink-soft">{track.description}</p>

      {isSubscriber && (
        <button
          type="button"
          onClick={async () => {
            setDownloading(true);
            try {
              const url = await getDownloadLink(track.id);
              const a = document.createElement('a');
              a.href = url;
              a.download = `${track.name}.mp3`;
              a.click();
            } catch {
              /* signed link failed — quietly do nothing rather than alarm mid-session */
            } finally {
              setDownloading(false);
            }
          }}
          disabled={downloading}
          className="text-label mt-4 text-ink-faint transition-colors hover:text-ink-soft disabled:opacity-50"
        >
          {downloading ? 'Preparing…' : `Download · stays offline ${DOWNLOAD_EXPIRY_DAYS} days`}
        </button>
      )}

      <div className="mt-7 h-12 w-full max-w-md">
        <Waveform getAnalyser={audio.analyser} playing={audio.playing} />
      </div>

      {/* Track progress — a single thin pine line. */}
      <div className="mt-5 w-full max-w-md">
        <div className="h-px w-full bg-line">
          <div
            className="h-px bg-accent transition-[width] duration-1000 ease-linear"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="mt-2 flex justify-between text-caption tabular-nums">
          <span>{formatTime(audio.position)}</span>
          <span>{audio.loop ? 'Looping' : formatTime(audio.duration)}</span>
        </div>
      </div>

      {/* Controls — loop · play/pause · skip. */}
      <div className="mt-7 flex items-center gap-8">
        <button
          type="button"
          onClick={audio.toggleLoop}
          aria-pressed={audio.loop}
          aria-label="Loop"
          className={`transition-colors ${audio.loop ? 'text-accent' : 'text-ink-faint hover:text-ink-soft'}`}
        >
          <LoopIcon />
        </button>

        <button
          type="button"
          onClick={audio.toggle}
          aria-label={audio.playing ? 'Pause' : 'Play'}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-ink text-paper transition-colors hover:bg-accent"
        >
          {audio.playing ? <PauseIcon /> : <PlayIcon />}
        </button>

        <button
          type="button"
          onClick={audio.skipNext}
          aria-label="Skip to next"
          className="text-ink-faint transition-colors hover:text-ink-soft"
        >
          <SkipIcon />
        </button>
      </div>

      <p className="text-caption mt-6 tabular-nums">In session · {formatTime(audio.elapsed)}</p>
    </section>
  );
}

function PlayIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}
function PauseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
    </svg>
  );
}
function SkipIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
    </svg>
  );
}
function LoopIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M17 2l4 4-4 4" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <path d="M7 22l-4-4 4-4" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  );
}
