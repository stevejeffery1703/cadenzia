import { useCallback, useEffect, useState } from 'react';
import { getMe } from '../utils/auth';
import { getToken, setToken } from '../utils/api';

// Resolves the current user's Premium status from the Worker, which checks D1
// (kept in sync by the Stripe webhook, plus any comp grant). "Premium" means
// paid OR comped; the raw Stripe status is kept separately so the account page
// can tell a billing subscriber apart from a comped one. Anonymous users are
// simply "free". Cached in memory; refreshed on mount and on demand.
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
      // Effective entitlement: paid or comped. is_premium is computed server-side.
      setStatus(me && me.is_premium ? 'active' : 'free');
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
    // True only for a paying Stripe subscriber (has a billing portal); a comped
    // user has access but no portal.
    stripeActive: user?.subscription_status === 'active',
    loading,
    sessionExpired,
    refresh,
  };
}
