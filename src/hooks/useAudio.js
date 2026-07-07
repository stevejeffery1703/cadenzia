import { useCallback, useEffect, useRef, useState } from 'react';
import { getCategory, nextTrack as nextInCategory } from '../utils/tracks';
import { APP_NAME, FADE_IN_SECONDS, CROSSFADE_SECONDS, GATE_FADE_SECONDS } from '../utils/config';

// Playback engine.
//
// Deliberately a single, bare HTMLAudioElement — NOT routed through Web Audio.
// Reliable background playback is the whole point: iOS suspends an AudioContext
// the instant the tab/PWA is backgrounded or the screen locks, which silences
// anything played through a Web Audio graph. A plain <audio> element paired with
// the Media Session API is what the OS treats as real background media — it keeps
// playing on the lock screen like a podcast. So there is intentionally no
// AudioContext, no analyser, and no GainNodes here.
//
// Consequences of that choice, all deliberate:
//   • Fades are done by ramping the element's own `volume`. iOS ignores
//     programmatic volume, so there a fade is simply a clean cut — harmless,
//     since there is no volume slider in the UI.
//   • Track changes dip out and back in on the SAME element rather than
//     overlap-crossfading two elements (an overlap would double loudness on iOS
//     where the outgoing track can't be faded down).
//   • The waveform is cosmetic/synthetic now — there is no live spectrum to tap.

const resolve = (src) => new URL(src, window.location.href).href;

const LAST_TRACK_KEY = 'cad_last_track';

// Read back where a returning visitor left off, so the player can offer to
// resume instead of always starting from "Choose something to begin."
export function getLastTrackId() {
  return localStorage.getItem(LAST_TRACK_KEY) || null;
}

export function useAudio({ onTick, onTrackComplete } = {}) {
  const elRef = useRef(null); // the single <audio> element
  const fadeRef = useRef(0); // active volume-tween rAF id
  const intentRef = useRef(false); // whether we intend to be playing (bg recovery)
  const canControlVolumeRef = useRef(true); // false on iOS, where volume is fixed
  const playedRef = useRef(0); // seconds actually played of the current track
  const countedRef = useRef(false); // whether this load's completion was recorded

  const [track, setTrack] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [loop, setLoop] = useState(false);
  const [volume, setVolumeState] = useState(0.8);
  const [elapsed, setElapsed] = useState(0); // seconds into the session (gate)
  const [position, setPosition] = useState(0); // seconds into the current track
  const [duration, setDuration] = useState(0);

  const volumeRef = useRef(volume);
  const trackRef = useRef(track);
  trackRef.current = track;
  const cbRef = useRef({ onTick, onTrackComplete });
  cbRef.current = { onTick, onTrackComplete };
  // onEnded (wired once, on mount) needs the latest loadTrack without
  // re-subscribing every render — reach it through a ref.
  const loadTrackRef = useRef(null);

  const applyVolume = useCallback((v) => {
    const el = elRef.current;
    if (el) el.volume = Math.max(0, Math.min(1, v));
  }, []);

  const cancelFade = useCallback(() => {
    if (fadeRef.current) {
      cancelAnimationFrame(fadeRef.current);
      fadeRef.current = 0;
    }
  }, []);

  // Ramp element volume to `fraction` (0..1 of the user volume) over `seconds`.
  // Jumps instantly when the page is hidden: rAF is frozen in the background, and
  // we must never leave audio stuck at a silent volume — otherwise a track that
  // auto-advances while backgrounded would play inaudibly.
  const fadeTo = useCallback(
    (fraction, seconds, onDone) => {
      const el = elRef.current;
      if (!el) return;
      cancelFade();
      const target = fraction * volumeRef.current;
      // Jump instantly when there's nothing to animate: hidden pages freeze rAF,
      // and where volume is fixed (iOS) a timed ramp would just hold the current
      // level and then jump anyway — so collapse it to a clean set/stop.
      if (document.hidden || seconds <= 0 || !canControlVolumeRef.current) {
        applyVolume(target);
        onDone?.();
        return;
      }
      const from = el.volume;
      const start = performance.now();
      const durMs = seconds * 1000;
      const step = (now) => {
        const t = Math.min(1, (now - start) / durMs);
        applyVolume(from + (target - from) * t);
        if (t < 1) {
          fadeRef.current = requestAnimationFrame(step);
        } else {
          fadeRef.current = 0;
          applyVolume(target);
          onDone?.();
        }
      };
      fadeRef.current = requestAnimationFrame(step);
    },
    [applyVolume, cancelFade]
  );

  const updateMediaSession = useCallback((t) => {
    if (!('mediaSession' in navigator) || !t) return;
    const category = getCategory(t.categoryId);
    try {
      // eslint-disable-next-line no-undef
      navigator.mediaSession.metadata = new MediaMetadata({
        title: t.name,
        artist: category ? category.name : APP_NAME,
        album: APP_NAME,
      });
    } catch {
      /* MediaMetadata unavailable — non-fatal */
    }
  }, []);

  // Create the single audio element once, and wire the element's own events as
  // the source of truth for play/pause/ended — so the UI can't lie about state
  // after the OS pauses us in the background.
  useEffect(() => {
    const el = new Audio();
    el.preload = 'auto';
    // No crossOrigin: we no longer read samples, so avoid a CORS dependency that
    // could otherwise taint/break plain playback.
    elRef.current = el;

    // Probe once whether programmatic volume actually works. iOS pins element
    // volume under hardware control, so fades there must degrade to a clean cut
    // (see fadeTo) rather than a pointless "hold full, then stop". Set a value,
    // read it back, restore.
    el.volume = 0.5;
    canControlVolumeRef.current = el.volume !== 1;
    el.volume = 1;

    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onTime = () => {
      setPosition(el.currentTime || 0);
      if (el.duration && !Number.isNaN(el.duration)) setDuration(el.duration);
    };
    const onEnded = () => {
      if (el.loop) return; // native loop re-plays; 'ended' won't fire, but be safe
      const t = trackRef.current;
      if (t && !countedRef.current) {
        countedRef.current = true;
        cbRef.current.onTrackComplete?.(t);
      }
      const n = t ? nextInCategory(t.id) : null;
      if (n) {
        loadTrackRef.current?.(n, { autoplay: true });
      } else {
        intentRef.current = false;
        setPlaying(false);
      }
    };

    el.addEventListener('play', onPlay);
    el.addEventListener('pause', onPause);
    el.addEventListener('timeupdate', onTime);
    el.addEventListener('ended', onEnded);

    return () => {
      cancelFade();
      el.removeEventListener('play', onPlay);
      el.removeEventListener('pause', onPause);
      el.removeEventListener('timeupdate', onTime);
      el.removeEventListener('ended', onEnded);
      try {
        el.pause();
      } catch {
        /* no-op */
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Per-second session clock. Drives the free-tier gate. (Throttles in the
  // background, which only makes the free hour more generous — never less.)
  useEffect(() => {
    if (!playing) return undefined;
    const id = setInterval(() => {
      // Played-time accumulator. Looping tracks (Deep Focus, Calm) never fire
      // 'ended', so a "completion" — what recordPlay/recordSession count — is
      // taken once the elapsed play time passes the track's nominal length.
      // countedRef guards against counting a track twice (accumulator + 'ended').
      const t = trackRef.current;
      playedRef.current += 1;
      if (t && !countedRef.current && t.durationSeconds && playedRef.current >= t.durationSeconds) {
        countedRef.current = true;
        cbRef.current.onTrackComplete?.(t);
      }
      setElapsed((prev) => {
        const next = prev + 1;
        cbRef.current.onTick?.(next, t);
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [playing]);

  const play = useCallback(() => {
    const el = elRef.current;
    if (!el || !el.src) return;
    intentRef.current = true;
    setPlaying(true);
    applyVolume(0);
    el.play()
      .then(() => {
        // Restore the track's own metadata — resuming after the gate replaces
        // the "free hour is up" lock-screen notice with the now-playing piece.
        updateMediaSession(trackRef.current);
        fadeTo(1, FADE_IN_SECONDS);
      })
      .catch(() => {
        /* placeholder masters 404 in dev — the session UI still runs */
      });
  }, [applyVolume, fadeTo, updateMediaSession]);

  const pause = useCallback(() => {
    const el = elRef.current;
    intentRef.current = false;
    setPlaying(false);
    if (!el) return;
    fadeTo(0, 0.3, () => {
      try {
        el.pause();
      } catch {
        /* no-op */
      }
    });
  }, [fadeTo]);

  // The daily gate. Fade the music down gently over a few seconds where volume
  // is controllable; where it isn't (iOS), fadeTo collapses this to an immediate
  // clean stop — harmless, since the looping categories are transient-free.
  const pauseForGate = useCallback(() => {
    const el = elRef.current;
    intentRef.current = false;
    setPlaying(false);
    if (!el) return;
    fadeTo(0, GATE_FADE_SECONDS, () => {
      try {
        el.pause();
      } catch {
        /* no-op */
      }
    });
  }, [fadeTo]);

  // Explain the pause on the lock screen / media controls, for a listener who's
  // backgrounded when the gate lands and won't see the on-screen interstitial.
  const announceGate = useCallback(() => {
    if (!('mediaSession' in navigator)) return;
    try {
      // eslint-disable-next-line no-undef
      navigator.mediaSession.metadata = new MediaMetadata({
        title: 'Your free hour is up for today',
        artist: 'Open Cadenzia to keep listening',
        album: APP_NAME,
      });
    } catch {
      /* MediaMetadata unavailable — non-fatal */
    }
  }, []);

  // Load a track on the single element. If something is already playing, dip the
  // volume out, swap the source, then fade back in — a clean transition with no
  // overlap (see the header note on why we don't overlap-crossfade).
  const loadTrack = useCallback(
    (nextTrack, { autoplay = true, resetSession = false } = {}) => {
      if (!nextTrack) return;
      const el = elRef.current;
      if (!el) return;

      const start = () => {
        el.src = nextTrack.file;
        el.loop = !!nextTrack.loop;
        el.currentTime = 0;
        applyVolume(0);
        playedRef.current = 0; // fresh completion accounting for the new track
        countedRef.current = false;

        setTrack(nextTrack);
        setLoop(!!nextTrack.loop);
        setPosition(0);
        setDuration(nextTrack.durationSeconds || 0);
        if (resetSession) setElapsed(0);
        updateMediaSession(nextTrack);
        localStorage.setItem(LAST_TRACK_KEY, nextTrack.id);

        if (autoplay) {
          intentRef.current = true;
          setPlaying(true);
          el.play()
            .then(() => fadeTo(1, FADE_IN_SECONDS))
            .catch(() => {});
        } else {
          setPlaying(false);
        }
      };

      const switching =
        autoplay && !el.paused && el.src && resolve(el.src) !== resolve(nextTrack.file);
      if (switching) {
        fadeTo(0, Math.min(0.4, CROSSFADE_SECONDS / 2), start);
      } else {
        start();
      }
    },
    [applyVolume, fadeTo, updateMediaSession]
  );
  loadTrackRef.current = loadTrack;

  const toggle = useCallback(() => {
    if (playing) pause();
    else play();
  }, [playing, play, pause]);

  const skipNext = useCallback(() => {
    const t = trackRef.current;
    if (!t) return;
    const n = nextInCategory(t.id);
    if (n) loadTrack(n, { autoplay: true });
  }, [loadTrack]);

  const toggleLoop = useCallback(() => {
    setLoop((prev) => {
      const next = !prev;
      if (elRef.current) elRef.current.loop = next;
      return next;
    });
  }, []);

  const setVolume = useCallback(
    (v) => {
      volumeRef.current = v;
      setVolumeState(v);
      // Reflect immediately when audible and not mid-fade; fades read volumeRef.
      if (!fadeRef.current && intentRef.current) applyVolume(v);
    },
    [applyVolume]
  );

  // Keep the OS/lock-screen state in sync with our own.
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.playbackState = playing ? 'playing' : 'paused';
  }, [playing]);

  // Lock-screen / hardware controls.
  useEffect(() => {
    if (!('mediaSession' in navigator)) return undefined;
    navigator.mediaSession.setActionHandler('play', play);
    navigator.mediaSession.setActionHandler('pause', pause);
    navigator.mediaSession.setActionHandler('nexttrack', skipNext);
    return () => {
      navigator.mediaSession.setActionHandler('play', null);
      navigator.mediaSession.setActionHandler('pause', null);
      navigator.mediaSession.setActionHandler('nexttrack', null);
    };
  }, [play, pause, skipNext]);

  // Returning to the foreground: if the OS paused us in the background but we
  // still intend to play, resume. (A no-op when the element kept playing.)
  useEffect(() => {
    const onVisible = () => {
      if (document.hidden) return;
      const el = elRef.current;
      if (el && intentRef.current && el.paused && el.src) {
        el.play().catch(() => {});
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

  return {
    track,
    playing,
    loop,
    volume,
    elapsed,
    position,
    duration,
    loadTrack,
    play,
    pause,
    pauseForGate,
    announceGate,
    toggle,
    skipNext,
    toggleLoop,
    setVolume,
  };
}

export function formatTime(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds || 0));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}
