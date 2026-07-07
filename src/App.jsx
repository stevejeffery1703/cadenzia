import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useSearchParams } from 'react-router-dom';
import Nav from './components/Nav';
import Home from './pages/Home';
import AppPage from './pages/AppPage';
import Science from './pages/Science';
import Account from './pages/Account';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import NotFound from './pages/NotFound';
import { useSubscription } from './hooks/useSubscription';

export default function App() {
  // Subscription is resolved once at the top and passed down — pages don't each
  // re-fetch status.
  const subscription = useSubscription();

  return (
    <BrowserRouter>
      <RouteProgress />
      <ReferralCapture />
      <Nav isSubscriber={subscription.isSubscriber} isSignedIn={!!subscription.user} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/app" element={<AppPage subscription={subscription} />} />
        <Route path="/science" element={<Science />} />
        <Route path="/account" element={<Account subscription={subscription} />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

// Captures a referral tag from ?ref= on first arrival and stashes it locally
// (first-touch — an existing pending tag isn't overwritten), then cleans it out
// of the URL. It's redeemed later, at sign-up (see utils/auth.exchangeToken).
function ReferralCapture() {
  const [params, setParams] = useSearchParams();
  useEffect(() => {
    const ref = params.get('ref');
    if (!ref) return;
    if (!localStorage.getItem('cad_ref')) localStorage.setItem('cad_ref', ref);
    params.delete('ref');
    setParams(params, { replace: true });
  }, [params, setParams]);
  return null;
}

// A single thin gold line at the top of the viewport on navigation — the only
// loading affordance, like NProgress.
function RouteProgress() {
  const { pathname } = useLocation();
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 450);
    return () => clearTimeout(t);
  }, [pathname]);
  return loading ? <div className="loading-bar" /> : null;
}
