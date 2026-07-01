import { useCallback, useEffect, useState } from 'react';
import { getMe } from '../utils/supabase';
import { getToken } from '../utils/api';

// Resolves the current user's subscription status from the Worker, which checks
// Supabase (kept in sync by the Stripe webhook). Anonymous users are simply
// "free". Cached in memory; refreshed on mount and on demand.
export function useSubscription() {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('free'); // 'free' | 'active' | 'loading'
  const [loading, setLoading] = useState(true);

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
    } catch {
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
    refresh,
  };
}
