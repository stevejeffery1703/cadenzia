import { useCallback, useEffect, useState } from 'react';
import { FREE_DAILY_MINUTES } from '../utils/config';
import { todayKey } from '../utils/day';

// Free-tier daily gate.
//
// The model is per-day, not per-session: a free listener gets an hour of open
// listening pooled across every session and track in a day. When it's used up,
// the day's one calm choice appears — subscribe, or continue free for the rest
// of today. It resets at local midnight.
//
// State lives in localStorage (not sessionStorage) so the hour can't be reset
// by relaunching the tab, and so it genuinely accumulates across separate work
// blocks. This is first-party functional storage — enforcing our own free tier,
// not tracking — so it needs no consent banner. It's clearable (incognito, etc.);
// that's fine, the gate is a gentle daily nudge, not a wall to defend.

const KEY = 'cad_daily_v1';

function load() {
  let stored = {};
  try {
    stored = JSON.parse(localStorage.getItem(KEY) || '{}');
  } catch {
    stored = {};
  }
  // A new day wipes the slate — seconds and the "continue free today" unlock.
  if (stored.day !== todayKey()) return { day: todayKey(), seconds: 0, unlocked: false };
  return { day: stored.day, seconds: stored.seconds || 0, unlocked: !!stored.unlocked };
}

export function useSession({ isSubscriber = false } = {}) {
  const [state, setState] = useState(load);

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(state));
  }, [state]);

  // Roll the day over when the tab is left open across midnight and brought back
  // to the foreground. Without this a listener gated yesterday stays gated today:
  // playback is paused at the gate, so the addSecond tick that would reset the
  // day never fires, and they'd be stuck until a manual refresh.
  useEffect(() => {
    const onVisible = () => {
      if (document.hidden) return;
      setState((prev) => (prev.day === todayKey() ? prev : load()));
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

  const addSecond = useCallback(() => {
    setState((prev) => {
      // Roll over live if the clock crosses midnight mid-session.
      if (prev.day !== todayKey()) return { day: todayKey(), seconds: 1, unlocked: false };
      return { ...prev, seconds: prev.seconds + 1 };
    });
  }, []);

  // "Continue free today" — the honest soft escape. No further gate until the
  // day resets.
  const unlockSession = useCallback(() => {
    setState((prev) => ({ ...prev, unlocked: true }));
  }, []);

  // Derive against the *current* day, so a stale carry-over from before midnight
  // (no tick has rolled it yet) reads as a fresh, ungated day rather than
  // yesterday's used-up one.
  const fresh = state.day === todayKey();
  const seconds = fresh ? state.seconds : 0;
  const unlocked = fresh ? state.unlocked : false;

  const limitSeconds = FREE_DAILY_MINUTES * 60;
  const minutesListened = Math.floor(seconds / 60);
  const minutesRemaining = Math.max(0, FREE_DAILY_MINUTES - minutesListened);

  // Subscribers, and free listeners who chose "continue free today", are never gated.
  const gateReached = !isSubscriber && !unlocked && seconds >= limitSeconds;

  return {
    minutesListened,
    minutesRemaining,
    gateReached,
    unlocked: unlocked || isSubscriber,
    addSecond,
    unlockSession,
  };
}
