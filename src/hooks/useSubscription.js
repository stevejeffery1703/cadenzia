import { useCallback, useEffect, useState } from 'react';
import { getMe } from '../utils/auth';
import { getToken, setToken } from '../utils/api';

// Resolves the current user's subscription status from the Worker, which checks
// D1 (kept in sync by the Stripe webhook). Anonymous users are simply
// "free". Cached in memory; refreshed on mount and on demand.
export function useSubscription() {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('free'); // 'free' | 'active' | 'loading'
  const [loading, setLoading] = useState(true);
  // True only when a *previously valid* session died (expired/invalid JWT) —
  // distinct from a visitor who never signed in, so the UI can explain what
  // happened instead of silently reverting to "free" as if nothing changed.
  const [sessionExpired, setSessionExpired] = useState(false);

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setUser(null);
      setStatus('free');
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const me = await getMe();
      setUser(me);
      setStatus(me && me.subscription_status === 'active' ? 'active' : 'free');
      setSessionExpired(false);
    } catch (err) {
      if (err.status === 401) {
        setToken(null); // dead token — stop retrying with it
        setSessionExpired(true);
      }
      setUser(null);
      setStatus('free');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    user,
    isSubscriber: status === 'active',
    status,
    loading,
    sessionExpired,
    refresh,
  };
}
