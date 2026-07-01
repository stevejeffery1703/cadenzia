import { useCallback, useEffect, useState } from 'react';
import { FREE_SESSION_MINUTES } from '../utils/config';

// Free-tier session gate.
//
// The model is per-session, not per-day: a free listener has unlimited access
// for the first hour of any session. After that, one share (or a subscription)
// continues the session. State lives in sessionStorage so a refresh within the
// same tab keeps the session, while opening the app fresh starts a new one.

const KEY = 'cad_session_v1';

function load() {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) || '{}');
  } catch {
    return {};
  }
}

export function useSession({ isSubscriber = false } = {}) {
  const [seconds, setSeconds] = useState(() => load().seconds || 0);
  const [unlocked, setUnlocked] = useState(() => !!load().unlocked);

  useEffect(() => {
    sessionStorage.setItem(KEY, JSON.stringify({ seconds, unlocked }));
  }, [seconds, unlocked]);

  const addSecond = useCallback(() => {
    setSeconds((s) => s + 1);
  }, []);

  // Called once the listener shares — continues this session, no further gate.
  const unlockSession = useCallback(() => {
    setUnlocked(true);
  }, []);

  const limitSeconds = FREE_SESSION_MINUTES * 60;
  const minutesListened = Math.floor(seconds / 60);
  const minutesRemaining = Math.max(0, FREE_SESSION_MINUTES - minutesListened);

  // Subscribers and listeners who have shared this session are never gated.
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
