import { useCallback, useEffect, useState } from 'react';
import { FREE_DAILY_MINUTES } from '../utils/config';

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

// A stable local-day stamp ("2026-7-6"). Local time on purpose: "resets each
// day" should mean the listener's own midnight, not UTC.
function today() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function load() {
  let stored = {};
  try {
    stored = JSON.parse(localStorage.getItem(KEY) || '{}');
  } catch {
    stored = {};
  }
  // A new day wipes the slate — seconds and the "continue free today" unlock.
  if (stored.day !== today()) return { day: today(), seconds: 0, unlocked: false };
  return { day: stored.day, seconds: stored.seconds || 0, unlocked: !!stored.unlocked };
}

export function useSession({ isSubscriber = false } = {}) {
  const [state, setState] = useState(load);

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(state));
  }, [state]);

  const addSecond = useCallback(() => {
    setState((prev) => {
      // Roll over live if the clock crosses midnight mid-session.
      if (prev.day !== today()) return { day: today(), seconds: 1, unlocked: false };
      return { ...prev, seconds: prev.seconds + 1 };
    });
  }, []);

  // "Continue free today" — the honest soft escape. No further gate until the
  // day resets.
  const unlockSession = useCallback(() => {
    setState((prev) => ({ ...prev, unlocked: true }));
  }, []);

  const limitSeconds = FREE_DAILY_MINUTES * 60;
  const minutesListened = Math.floor(state.seconds / 60);
  const minutesRemaining = Math.max(0, FREE_DAILY_MINUTES - minutesListened);

  // Subscribers, and free listeners who chose "continue free today", are never gated.
  const gateReached = !isSubscriber && !state.unlocked && state.seconds >= limitSeconds;

  return {
    minutesListened,
    minutesRemaining,
    gateReached,
    unlocked: state.unlocked || isSubscriber,
    addSecond,
    unlockSession,
  };
}
