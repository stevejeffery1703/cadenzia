import { useCallback, useEffect, useRef, useState } from 'react';
import { getCategory, nextTrack as nextInCategory } from '../utils/tracks';
import { APP_NAME, FADE_IN_SECONDS, CROSSFADE_SECONDS } from '../utils/config';

// Playback engine.
//
// Audio runs through a Web Audio graph so we can fade and crossfade smoothly and
// tap an analyser for the waveform visualiser. Two HTMLAudioElements (good for
// streaming long masters and OS background playback) feed two gain nodes into a
// shared analyser → master gain → destination:
//
//   elementA → sourceA → gainA ┐
//                              ├→ analyser → master(volume) → destination
//   elementB → sourceB → gainB ┘
//
// A single track plays on the active channel at full mix gain; switching tracks
// crossfades by ramping the two channel gains in opposite directions. The audio
// context is created on first play (autoplay policy needs a user gesture).

const resolve = (src) => new URL(src, window.location.href).href;

export function useAudio({ onTick, onSessionComplete, onTrackComplete } = {}) {
  const A = useRef(null); // graph: { ctx, analyser, master, chans, active }
  const [track, setTrack] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [loop, setLoop] = useState(false);
  const [volume, setVolumeState] = useState(0.8);
  const [elapsed, setElapsed] = useState(0); // seconds into the session (gate)
  const [position, setPosition] = useState(0); // seconds into the current track
  const [duration, setDuration] = useState(0);

  const volumeRef = useRef(volume);
  const cbRef = useRef({ onTick, onSessionComplete, onTrackComplete });
  cbRef.current = { onTick, onSessionComplete, onTrackComplete };

  // Build the Web Audio graph once, on a user gesture.
  const ensureGraph = useCallback(() => {
    if (A.current) return A.current;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = new Ctx();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 1024;
    analyser.smoothingTimeConstant = 0.85;
    const master = ctx.createGain();
    master.gain.value = volumeRef.current;
    analyser.connect(master);
    master.connect(ctx.destination);

    const chans = [0, 1].map(() => {
      const el = new Audio();
      el.preload = 'auto';
      el.crossOrigin = 'anonymous';
      const source = ctx.createMediaElementSource(el);
      const gain = ctx.createGain();
      gain.gain.value = 0;
      source.connect(gain);
      gain.connect(analyser);
      return { el, source, gain };
    });

    A.current = { ctx, analyser, master, chans, active: 0 };
    return A.current;
  }, []);

  // Ramp a GainNode's gain param to `to` over `seconds` — the basis of fades
  // and crossfades. (cancelScheduledValues etc. live on the AudioParam, not the
  // node, so we reach through to gainNode.gain.)
  const ramp = useCallback((gainNode, to, seconds) => {
    const { ctx } = A.current;
    const param = gainNode.gain;
    const now = ctx.currentTime;
    param.cancelScheduledValues(now);
    param.setValueAtTime(param.value, now);
    param.linearRampToValueAtTime(to, now + Math.max(0.01, seconds));
  }, []);

  // Per-second session clock. Drives the free-tier gate and track position.
  useEffect(() => {
    if (!playing) return undefined;
    const id = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 1;
        cbRef.current.onTick?.(next);
        return next;
      });
      const g = A.current;
      if (g) {
        const el = g.chans[g.active].el;
        setPosition(el.currentTime || 0);
        if (el.duration && !Number.isNaN(el.duration)) setDuration(el.duration);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [playing]);

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

  const play = useCallback(() => {
    const g = ensureGraph();
    if (g.ctx.state === 'suspended') g.ctx.resume();
    const ch = g.chans[g.active];
    if (!ch.el.src) return;
    ch.el.play().catch(() => {
      /* placeholder masters 404 in dev — the session UI still runs */
    });
    ramp(ch.gain, 1, 0.4);
    setPlaying(true);
  }, [ensureGraph, ramp]);

  const pause = useCallback(() => {
    const g = A.current;
    setPlaying(false);
    if (!g) return;
    const ch = g.chans[g.active];
    ramp(ch.gain, 0, 0.3);
    setTimeout(() => {
      try {
        ch.el.pause();
      } catch {
        /* no-op */
      }
    }, 320);
  }, [ramp]);

  // Load a track. If something is already playing, crossfade to the new track on
  // the other channel; otherwise fade in on the active channel.
  const loadTrack = useCallback(
    (nextTrack, { autoplay = true, resetSession = false } = {}) => {
      if (!nextTrack) return;
      const g = ensureGraph();
      if (g.ctx.state === 'suspended') g.ctx.resume();

      const cur = g.chans[g.active];
      const switching = playing && cur.el.src && resolve(cur.el.src) !== resolve(nextTrack.file);

      if (switching) {
        const nextIdx = 1 - g.active;
        const nxt = g.chans[nextIdx];
        nxt.el.src = nextTrack.file;
        nxt.el.loop = !!nextTrack.loop;
        nxt.el.currentTime = 0;
        nxt.gain.gain.value = 0;
        nxt.el.play().catch(() => {});
        ramp(nxt.gain, 1, CROSSFADE_SECONDS);
        ramp(cur.gain, 0, CROSSFADE_SECONDS);
        const old = cur;
        setTimeout(() => {
          try {
            old.el.pause();
          } catch {
            /* no-op */
          }
        }, CROSSFADE_SECONDS * 1000 + 80);
        g.active = nextIdx;
      } else {
        cur.el.src = nextTrack.file;
        cur.el.loop = !!nextTrack.loop;
        cur.el.currentTime = 0;
        cur.gain.gain.value = 0;
        if (autoplay) {
          cur.el.play().catch(() => {});
          ramp(cur.gain, 1, FADE_IN_SECONDS);
        }
      }

      setTrack(nextTrack);
      setLoop(!!nextTrack.loop);
      setPosition(0);
      setDuration(nextTrack.durationSeconds || 0);
      if (resetSession) setElapsed(0);
      setPlaying(autoplay);
      updateMediaSession(nextTrack);
    },
    [ensureGraph, playing, ramp, updateMediaSession]
  );

  const toggle = useCallback(() => {
    if (playing) pause();
    else play();
  }, [playing, play, pause]);

  const skipNext = useCallback(() => {
    if (!track) return;
    const n = nextInCategory(track.id);
    if (n) loadTrack(n, { autoplay: true });
  }, [track, loadTrack]);

  const toggleLoop = useCallback(() => {
    setLoop((prev) => {
      const next = !prev;
      const g = A.current;
      if (g) g.chans[g.active].el.loop = next;
      return next;
    });
  }, []);

  const setVolume = useCallback((v) => {
    volumeRef.current = v;
    setVolumeState(v);
    const g = A.current;
    if (g) g.master.gain.value = v;
  }, []);

  // Auto-advance when a non-looping track ends: crossfade to the next track.
  useEffect(() => {
    const g = A.current;
    if (!g) return undefined;
    const handlers = g.chans.map((ch) => {
      const onEnded = () => {
        if (ch.el.loop) return;
        cbRef.current.onTrackComplete?.(track);
        const n = track ? nextInCategory(track.id) : null;
        if (n) loadTrack(n, { autoplay: true });
        else setPlaying(false);
      };
      ch.el.addEventListener('ended', onEnded);
      return { el: ch.el, onEnded };
    });
    return () => handlers.forEach(({ el, onEnded }) => el.removeEventListener('ended', onEnded));
  }, [track, loadTrack]);

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

  return {
    track,
    playing,
    loop,
    volume,
    elapsed,
    position,
    duration,
    analyser: () => A.current?.analyser || null,
    loadTrack,
    play,
    pause,
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
