import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { signOut } from '../utils/auth';
import { openBillingPortal } from '../utils/stripe';
import { api } from '../utils/api';
import { useEmailSignIn } from '../hooks/useEmailSignIn';
import { useDocumentHead } from '../hooks/useDocumentHead';
import { PRICE, PAYMENTS_ENABLED, PRELAUNCH_NOTE } from '../utils/config';

// Account. Minimal by design — sign in (which also syncs across devices),
// subscription, and a plainly available way to delete everything.
export default function Account({ subscription }) {
  useDocumentHead('/account');
  const { user, stripeActive, refresh, sessionExpired } = subscription;
  const signIn = useEmailSignIn({ onVerified: refresh });
  const [params, setParams] = useSearchParams();
  const [justSubscribed, setJustSubscribed] = useState(false);

  // Stripe redirects here after a successful checkout. The webhook that
  // flips subscription_status may land a moment after this redirect, so the
  // confirmation is driven by the param itself, not by isSubscriber yet
  // being true — otherwise it'd flicker or never show on a slow webhook.
  useEffect(() => {
    if (params.get('checkout') === 'success') {
      setJustSubscribed(true);
      params.delete('checkout');
      setParams(params, { replace: true });
      refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!user) {
    return (
      <main className="page-enter mx-auto max-w-md px-6 py-24">
        <h1 className="text-h1 text-ink">Sign in</h1>
        <p className="mt-3 text-sm text-ink-soft">
          {sessionExpired
            ? "Your session expired. Sign in again to continue — there's no password to remember."
            : "Enter your email and we'll send a one-time code — no password to remember."}
        </p>

        {signIn.step === 'email' ? (
          <form className="mt-8 space-y-3" onSubmit={signIn.sendCode}>
            <input
              type="email"
              required
              value={signIn.email}
              onChange={(e) => signIn.setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-full border border-line bg-paper-raised px-4 py-3 text-ink placeholder:text-ink-faint focus:border-accent"
            />
            <button className="btn-primary w-full" disabled={signIn.busy}>
              {signIn.busy ? 'Sending…' : 'Send sign-in code'}
            </button>
          </form>
        ) : (
          <form className="mt-8 space-y-3" onSubmit={signIn.verifyCode}>
            <p className="rounded-lg border border-line bg-paper-wash p-4 text-sm text-ink-soft">
              {signIn.resent
                ? `A new code is on its way to ${signIn.email}. It expires in 10 minutes.`
                : `A 6-digit code is on its way to ${signIn.email}. It expires in 10 minutes.`}
            </p>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              value={signIn.otp}
              onChange={(e) => signIn.setOtp(e.target.value)}
              placeholder="123456"
              className="w-full rounded-full border border-line bg-paper-raised px-4 py-3 text-center tracking-[0.3em] text-ink placeholder:text-ink-faint focus:border-accent"
            />
            <button className="btn-primary w-full" disabled={signIn.busy}>
              {signIn.busy ? 'Checking…' : 'Continue'}
            </button>
            <div className="flex justify-center gap-4 text-sm">
              <button type="button" onClick={signIn.resendCode} disabled={signIn.busy} className="text-ink-soft hover:text-ink">
                Resend code
              </button>
              <button type="button" onClick={signIn.useDifferentEmail} className="text-ink-soft hover:text-ink">
                Use a different email
              </button>
            </div>
          </form>
        )}

        {signIn.error && <p className="mt-3 text-sm text-warm">{signIn.error}</p>}
      </main>
    );
  }

  return (
    <main className="page-enter mx-auto max-w-3xl px-6 py-16">
      {justSubscribed && (
        <p className="mb-8 rounded-lg border border-line bg-paper-wash p-4 text-sm text-ink-soft">
          Thank you — you're subscribed. The full collection is open.
        </p>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-h1 text-ink">Account</h1>
          <p className="text-sm text-ink-soft">{user.email}</p>
        </div>
        <button
          onClick={() => {
            signOut();
            refresh();
          }}
          className="text-label text-ink-soft hover:text-ink"
        >
          Sign out
        </button>
      </div>

      <section className="panel mt-12 p-7">
        <h2 className="font-display text-2xl text-ink">Subscription</h2>
        {stripeActive ? (
          <>
            <p className="mt-2 text-sm text-ink-soft">Active — {PRICE.label}. Thank you for the support.</p>
            <button onClick={openBillingPortal} className="btn-ghost mt-5">
              Manage billing
            </button>
          </>
        ) : (
          <>
            <p className="mt-2 text-sm text-ink-soft">
              You&rsquo;re on the free tier — the free pieces, with no limit on how long you listen.
            </p>
            {PAYMENTS_ENABLED ? (
              <a href="/app?subscribe=1" className="btn-primary mt-5 inline-flex">
                Open the full collection — {PRICE.label}
              </a>
            ) : (
              <p className="mt-5 rounded-lg border border-line bg-paper-wash px-4 py-3 text-sm text-ink-soft">
                {PRELAUNCH_NOTE}
              </p>
            )}
          </>
        )}
      </section>

      <OwnerStats />

      <section className="mt-12">
        <h2 className="text-label text-ink-soft">Delete account</h2>
        <p className="mt-2 text-sm text-ink-soft">
          Removes your account and email record, and cancels any subscription. Immediate, with no
          deactivation delay.
        </p>
        <button
          onClick={async () => {
            if (!confirm('Delete your account and all associated data? This cannot be undone.')) return;
            await api('/auth/delete', { method: 'POST', auth: true });
            signOut();
            refresh();
          }}
          className="mt-5 rounded-full border border-warm/60 px-5 py-2.5 text-sm font-medium text-warm transition-colors hover:border-warm hover:bg-warm/10"
        >
          Delete everything
        </button>
      </section>
    </main>
  );
}

// Owner-only numbers. The endpoint 404s for everyone else (and whenever
// ADMIN_EMAIL isn't set), so this simply renders nothing for normal listeners —
// there's no flag to get wrong on the client. Aggregate counts only: no
// per-visitor tracking was added for this. Site traffic lives in Cloudflare
// Analytics, which measures it properly and filters bots; these are the numbers
// only the database knows.
function OwnerStats() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    let live = true;
    api('/admin/stats', { auth: true })
      .then((d) => live && setStats(d))
      .catch(() => {}); // 404 for non-owners — expected, stay silent
    return () => {
      live = false;
    };
  }, []);

  if (!stats) return null;

  const FIELDS = [
    ['Plays', stats.plays],
    ['Accounts', stats.users],
    ['Subscribers', stats.subscribers],
    ['Mailing list', stats.mailing],
  ];

  return (
    <section className="mt-12">
      <h2 className="text-label text-ink-soft">Yours only</h2>
      <div className="panel mt-3 grid grid-cols-2 gap-px overflow-hidden bg-line sm:grid-cols-4">
        {FIELDS.map(([label, value]) => (
          <div key={label} className="bg-paper-raised px-4 py-5 text-center">
            <p className="font-display text-3xl font-light tabular-nums text-ink">
              {value === null || value === undefined ? '—' : value.toLocaleString()}
            </p>
            <p className="text-caption mt-1">{label}</p>
          </div>
        ))}
      </div>
      <p className="text-caption mt-3">
        Only you can see this. For visits and traffic, see Cloudflare Analytics — it counts properly
        and filters bots.
      </p>
    </section>
  );
}
