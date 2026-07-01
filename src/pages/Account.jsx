import { useState } from 'react';
import { signInWithEmail, signOut } from '../utils/auth';
import { openBillingPortal } from '../utils/stripe';
import { api } from '../utils/api';
import StatsPanel from '../components/StatsPanel';
import { PRICE } from '../utils/config';

// Account. Minimal by design — sign in, subscription, history for subscribers,
// and a plainly available way to delete everything.
export default function Account({ subscription }) {
  const { user, isSubscriber, refresh } = subscription;
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  if (!user) {
    return (
      <main className="page-enter mx-auto max-w-md px-6 py-24">
        <h1 className="text-h1 text-ink">Sign in</h1>
        <p className="mt-3 text-sm text-ink-soft">
          We send a one-time link. There is no password to remember.
        </p>
        {sent ? (
          <p className="mt-8 rounded-lg border border-line bg-paper-wash p-4 text-sm text-ink-soft">
            A sign-in link is on its way. Check your inbox.
          </p>
        ) : (
          <form
            className="mt-8 space-y-3"
            onSubmit={async (e) => {
              e.preventDefault();
              await signInWithEmail(email);
              setSent(true);
            }}
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-full border border-line bg-paper-raised px-4 py-3 text-ink placeholder:text-ink-faint focus:border-accent"
            />
            <button className="btn-primary w-full">Send sign-in link</button>
          </form>
        )}
      </main>
    );
  }

  return (
    <main className="page-enter mx-auto max-w-3xl px-6 py-16">
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

      {isSubscriber && (
        <section className="mt-12">
          <h2 className="text-label text-ink-soft">Session history</h2>
          <p className="mt-1 text-sm text-ink-faint">For your eyes only. Never sold, never shared.</p>
          <div className="mt-5">
            <StatsPanel stats={user.stats} />
          </div>
        </section>
      )}

      <section className="panel mt-12 p-7">
        <h2 className="font-display text-2xl text-ink">Subscription</h2>
        {isSubscriber ? (
          <>
            <p className="mt-2 text-sm text-ink-soft">Active — {PRICE.label}. Thank you for the support.</p>
            <button onClick={openBillingPortal} className="btn-ghost mt-5">
              Manage billing
            </button>
          </>
        ) : (
          <>
            <p className="mt-2 text-sm text-ink-soft">You are on the free tier.</p>
            <a href="/app?subscribe=1" className="btn-primary mt-5 inline-flex">
              Listen without limits — {PRICE.label}
            </a>
          </>
        )}
      </section>

      <section className="mt-12">
        <h2 className="text-label text-ink-soft">Delete account</h2>
        <p className="mt-2 text-sm text-ink-soft">
          Removes your account, listening history, and email record, and cancels any subscription.
          Immediate, with no deactivation delay.
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
