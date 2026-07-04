import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
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
