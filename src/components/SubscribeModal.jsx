import { useState } from 'react';
import { startCheckout } from '../utils/stripe';
import { signInWithEmail } from '../utils/auth';
import { getToken } from '../utils/api';
import { PRICE, APP_NAME, DOWNLOAD_EXPIRY_DAYS } from '../utils/config';

// The paid tier, presented quietly. No card fields here — the Worker creates a
// Stripe Checkout Session and we hand off to Stripe's secure page. If the listener
// is not signed in yet, we take an email and send a sign-in link first.
export default function SubscribeModal({ open, onClose }) {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sentLink, setSentLink] = useState(false);
  const [error, setError] = useState(null);
  if (!open) return null;

  const signedIn = !!getToken();

  const go = async () => {
    setBusy(true);
    setError(null);
    try {
      if (!signedIn) {
        await signInWithEmail(email);
        setSentLink(true);
      } else {
        await startCheckout();
      }
    } catch (e) {
      setError('That did not go through. Please try again in a moment.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/30 p-4 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="panel w-full max-w-md p-8"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Subscribe"
      >
        <h2 className="text-h2 text-ink">Uninterrupted.</h2>
        <p className="mt-3 text-sm leading-relaxed text-ink-soft">
          Every track, no hourly pause, and downloads that stay with you offline for{' '}
          {DOWNLOAD_EXPIRY_DAYS} days. Cancel anytime.
        </p>

        <div className="mt-6 flex items-baseline gap-2 border-y border-line py-4">
          <span className="font-display text-4xl font-light text-ink">${PRICE.amount}</span>
          <span className="text-ink-soft">/ month</span>
        </div>

        {sentLink ? (
          <p className="mt-6 rounded-lg border border-line bg-paper-wash p-4 text-sm text-ink-soft">
            A sign-in link is on its way to {email}. Open it, then return here to finish.
          </p>
        ) : (
          <div className="mt-6 space-y-3">
            {!signedIn && (
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-line bg-paper-raised px-4 py-3 text-ink placeholder:text-ink-faint focus:border-accent"
              />
            )}
            <button
              type="button"
              disabled={busy || (!signedIn && !email)}
              onClick={go}
              className="btn-primary w-full disabled:opacity-50"
            >
              {busy ? 'One moment…' : signedIn ? 'Continue to checkout' : 'Continue'}
            </button>
          </div>
        )}

        {error && <p className="mt-3 text-sm text-warm">{error}</p>}

        <p className="text-caption mt-5 text-center">
          Secure checkout by Stripe. {APP_NAME} never sees your card details.
        </p>
      </div>
    </div>
  );
}
