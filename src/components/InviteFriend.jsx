import { useEffect, useState } from 'react';
import { APP_URL } from '../utils/config';

const SEEN_KEY = 'cad_ref_seen';

// Invite a friend — framed as generosity, not a personal incentive. Everyone's
// first week on Cadenzia is free; a friend you invite gets two. Nothing is
// dangled in return — just their join count and, when one joins, a quiet
// thank-you. (The "two weeks" copy mirrors REFERRED_TRIAL_DAYS on the Worker.)
export default function InviteFriend({ referralCode, referralCount = 0 }) {
  const [copied, setCopied] = useState(false);
  const [justJoined, setJustJoined] = useState(false);

  // A one-time "a friend joined" acknowledgment the first time the count grows
  // since it was last viewed — a small thank-you, no push/email needed. referralCode
  // and referralCount arrive together (same /me payload), so when this runs with a
  // code present the count is already the real value, not a mid-load zero.
  useEffect(() => {
    if (!referralCode) return;
    const raw = localStorage.getItem(SEEN_KEY);
    if (raw === null) {
      localStorage.setItem(SEEN_KEY, String(referralCount)); // baseline; celebrate nothing yet
      return;
    }
    if (referralCount > Number(raw)) {
      setJustJoined(true);
      localStorage.setItem(SEEN_KEY, String(referralCount));
    }
  }, [referralCode, referralCount]);

  if (!referralCode) return null;

  const link = `${APP_URL}?ref=${referralCode}`;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — the field is still selectable as a fallback */
    }
  };

  return (
    <section className="panel mt-12 p-7">
      <h2 className="font-display text-2xl text-ink">Give a friend a head start</h2>
      <p className="mt-2 text-sm text-ink-soft">
        Everyone’s first week on Cadenzia is free. A friend you invite gets two — double the usual
        welcome, and a better start than anyone else gets. Nothing asked in return.
      </p>

      {justJoined && (
        <p className="mt-4 rounded-lg border border-accent/40 bg-paper-wash p-3 text-sm text-ink">
          A friend just joined through your link — thank you for sharing Cadenzia.
        </p>
      )}

      <div className="mt-5 flex gap-2">
        <input
          readOnly
          value={link}
          onClick={(e) => e.target.select()}
          aria-label="Your invite link"
          className="min-w-0 flex-1 rounded-full border border-line bg-paper-raised px-4 py-2.5 text-sm text-ink-soft"
        />
        <button type="button" onClick={copy} className="btn-ghost shrink-0">
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      {referralCount > 0 && (
        <p className="text-caption mt-3">
          {referralCount} {referralCount === 1 ? 'friend has' : 'friends have'} joined through your
          link.
        </p>
      )}
    </section>
  );
}
