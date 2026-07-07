import { useEmailSignIn } from '../hooks/useEmailSignIn';
import { APP_NAME, INTRO_TRIAL_DAYS } from '../utils/config';

// "Create a free account" — the sign-up path offered on the daily gate to a
// listener without an account. Same email→code flow as everywhere, but on success
// it just hands back (onVerified refreshes status); the server grants the free
// week at signup, and no checkout is involved. The WelcomeBanner greets them next.
export default function FreeWeekModal({ open, onClose, onVerified }) {
  const signIn = useEmailSignIn({ onVerified });
  if (!open) return null;

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
        aria-label="Create a free account"
      >
        <h2 className="text-h2 text-ink">Your first week's on us.</h2>
        <p className="mt-3 text-sm leading-relaxed text-ink-soft">
          Create a free account and get {INTRO_TRIAL_DAYS} days of Premium — no daily limit, and every
          track downloads. No card, nothing to cancel.
        </p>

        {signIn.step === 'email' ? (
          <form className="mt-6 space-y-3" onSubmit={signIn.sendCode}>
            <input
              type="email"
              required
              value={signIn.email}
              onChange={(e) => signIn.setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-line bg-paper-raised px-4 py-3 text-ink placeholder:text-ink-faint focus:border-accent"
            />
            <button
              type="submit"
              disabled={signIn.busy || !signIn.email}
              className="btn-primary w-full disabled:opacity-50"
            >
              {signIn.busy ? 'One moment…' : 'Send my code'}
            </button>
          </form>
        ) : (
          <form className="mt-6 space-y-3" onSubmit={signIn.verifyCode}>
            <p className="rounded-lg border border-line bg-paper-wash p-4 text-sm text-ink-soft">
              {signIn.resent
                ? `A new code is on its way to ${signIn.email}.`
                : `A 6-digit code is on its way to ${signIn.email}. Enter it below.`}
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
            <button type="submit" disabled={signIn.busy} className="btn-primary w-full disabled:opacity-50">
              {signIn.busy ? 'One moment…' : 'Start my free week'}
            </button>
            <div className="flex justify-center gap-4 text-sm">
              <button
                type="button"
                onClick={signIn.resendCode}
                disabled={signIn.busy}
                className="text-ink-soft hover:text-ink"
              >
                Resend code
              </button>
              <button
                type="button"
                onClick={signIn.useDifferentEmail}
                className="text-ink-soft hover:text-ink"
              >
                Use a different email
              </button>
            </div>
          </form>
        )}

        {signIn.error && <p className="mt-3 text-sm text-warm">{signIn.error}</p>}

        <p className="text-caption mt-5 text-center">
          A one-time code, no password. {APP_NAME} never sees a card.
        </p>
      </div>
    </div>
  );
}
