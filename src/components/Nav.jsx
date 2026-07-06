import { Link, useLocation } from 'react-router-dom';
import { APP_NAME, PRICE } from '../utils/config';
import Logo from './Logo';

// Quiet, sparse top bar. The mark and wordmark sit together; everything else is
// understated until you reach for an action.
export default function Nav({ isSubscriber, isSignedIn }) {
  const { pathname } = useLocation();
  const link = (to, label) => (
    <Link
      to={to}
      className={`text-label transition-colors hover:text-ink ${
        pathname === to ? 'text-ink' : 'text-ink-soft'
      }`}
    >
      {label}
    </Link>
  );

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-paper/80 backdrop-blur">
      <nav className="mx-auto flex max-w-content items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2.5" aria-label={`${APP_NAME} — home`}>
          <Logo size={28} />
          <span className="font-display text-2xl font-normal text-accent">{APP_NAME}</span>
        </Link>
        <div className="flex items-center gap-7">
          {link('/app', 'Listen')}
          {link('/account', isSignedIn ? 'Account' : 'Sign in')}
          {!isSubscriber && (
            <Link to="/app?subscribe=1" className="btn-primary hidden px-5 py-2 sm:inline-flex">
              Unlimited · {PRICE.short}
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
