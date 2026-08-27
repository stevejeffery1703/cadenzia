import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { APP_NAME, PRICE, PAYMENTS_ENABLED } from '../utils/config';
import Logo from './Logo';

// Quiet, sparse top bar. The mark and wordmark sit together; everything else is
// understated until you reach for an action.
//
// Desktop keeps the links inline. Below `sm` they collapse behind a hamburger:
// the wordmark is wide, and cramming three links plus a CTA beside it on a
// narrow phone was tight and getting tighter. The menu is a plain panel under
// the header rather than a full-screen overlay — same restraint as the rest of
// the app, and it never covers the player.
export default function Nav({ isSubscriber, isSignedIn }) {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  // Close on navigation, so tapping a link doesn't leave the panel hanging open
  // over the page it just moved to.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Escape closes it, like any other dismissible surface here.
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const ITEMS = [
    ['/app', 'Listen'],
    // Science sits in the top bar, not just the footer: the music is
    // hand-played, and how it's made is a reason to trust the product.
    ['/science', 'Science'],
    ['/account', isSignedIn ? 'Account' : 'Sign in'],
  ];

  // No subscribe CTA while payments are off — see PAYMENTS_ENABLED.
  const showCta = !isSubscriber && PAYMENTS_ENABLED;

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-paper/80 backdrop-blur">
      {/* z-20 keeps the bar itself above the dismiss backdrop below. */}
      <nav className="relative z-20 mx-auto flex max-w-content items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2.5" aria-label={`${APP_NAME} — home`}>
          <Logo size={28} />
          <span className="font-display text-2xl font-normal text-accent">{APP_NAME}</span>
        </Link>

        {/* Desktop: inline. */}
        <div className="hidden items-center gap-7 sm:flex">
          {ITEMS.map(([to, label]) => (
            <Link
              key={to}
              to={to}
              className={`text-label transition-colors hover:text-ink ${
                pathname === to ? 'text-ink' : 'text-ink-soft'
              }`}
            >
              {label}
            </Link>
          ))}
          {showCta && (
            <Link to="/app?subscribe=1" className="btn-primary px-5 py-2">
              Full collection · {PRICE.short}
            </Link>
          )}
        </div>

        {/* Mobile: hamburger. */}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="nav-menu"
          aria-label={open ? 'Close menu' : 'Open menu'}
          className="-mr-2 p-2 text-ink-soft transition-colors hover:text-ink sm:hidden"
        >
          {open ? <CloseIcon /> : <MenuIcon />}
        </button>
      </nav>

      {open && (
        <>
          {/* Tap anywhere else to dismiss. z-10 puts it under the bar and the
              panel (both z-20) but over the page. */}
          <div
            className="fixed inset-0 z-10 sm:hidden"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div
            id="nav-menu"
            className="relative z-20 border-t border-line bg-paper sm:hidden"
          >
            <div className="mx-auto flex max-w-content flex-col px-6 py-2">
              {ITEMS.map(([to, label]) => (
                <Link
                  key={to}
                  to={to}
                  className={`border-b border-line py-3.5 text-label transition-colors last:border-b-0 hover:text-ink ${
                    pathname === to ? 'text-ink' : 'text-ink-soft'
                  }`}
                >
                  {label}
                </Link>
              ))}
              {showCta && (
                <Link to="/app?subscribe=1" className="btn-primary my-3 justify-center">
                  Full collection · {PRICE.short}
                </Link>
              )}
            </div>
          </div>
        </>
      )}
    </header>
  );
}

function MenuIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}
