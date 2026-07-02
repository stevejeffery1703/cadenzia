import { useState } from 'react';
import { startCheckout } from '../utils/stripe';
import { getToken } from '../utils/api';
import { useEmailSignIn } from '../hooks/useEmailSignIn';
import { PRICE, APP_NAME, DOWNLOAD_EXPIRY_DAYS } from '../utils/config';

// The paid tier, presented quietly. No card fields here — the Worker creates a
// Stripe Checkout Session and we hand off to Stripe's secure page. If the listener
// is not signed in yet, we take an email, verify a one-time code, then continue
// straight to checkout.
export default function SubscribeModal({ open, onClose }) {
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [checkoutError, setCheckoutError] = useState(null);

  async function goToCheckout() {
    setCheckoutBusy(true);
    setCheckoutError(null);
    try {
      await startCheckout();
    } catch {
      setCheckoutError('That did not go through. Please try again in a moment.');
    } finally {
      setCheckoutBusy(false);
    }
  }

  const signIn = useEmailSignIn({ onVerified: goToCheckout });
  if (!open) return null;

  const signedIn = !!getToken();
  const busy = signIn.busy || checkoutBusy;
  const error = signIn.error || checkoutError;

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

        {signedIn ? (
          <button
            type="button"
            disabled={busy}
            onClick={goToCheckout}
            className="btn-primary mt-6 w-full disabled:opacity-50"
          >
            {busy ? 'One moment…' : 'Continue to checkout'}
          </button>
        ) : signIn.step === 'email' ? (
          <form className="mt-6 space-y-3" onSubmit={signIn.sendCode}>
            <input
              type="email"
              required
              value={signIn.email}
              onChange={(e) => signIn.setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-line bg-paper-raised px-4 py-3 text-ink placeholder:text-ink-faint focus:border-accent"
            />
            <button type="submit" disabled={busy || !signIn.email} className="btn-primary w-full disabled:opacity-50">
              {busy ? 'One moment…' : 'Continue'}
            </button>
          </form>
        ) : (
          <form className="mt-6 space-y-3" onSubmit={signIn.verifyCode}>
            <p className="rounded-lg border border-line bg-paper-wash p-4 text-sm text-ink-soft">
              A 6-digit code is on its way to {signIn.email}. Open it, then enter it below.
            </p>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              value={signIn.otp}
              onChange={(e) => signIn.setOtp(e.target.value)}
              placeholder="123456"
              className="w-full rounded-lg border border-line bg-paper-raised px-4 py-3 text-center tracking-[0.3em] text-ink placeholder:text-ink-faint focus:border-accent"
            />
            <button type="submit" disabled={busy} className="btn-primary w-full disabled:opacity-50">
              {busy ? 'One moment…' : 'Continue to checkout'}
            </button>
            <button
              type="button"
              onClick={signIn.useDifferentEmail}
              className="w-full text-center text-sm text-ink-soft hover:text-ink"
            >
              Use a different email
            </button>
          </form>
        )}

        {error && <p className="mt-3 text-sm text-warm">{error}</p>}

        <p className="text-caption mt-5 text-center">
          Secure checkout by Stripe. {APP_NAME} never sees your card details.
        </p>
      </div>
    </div>
  );
}
