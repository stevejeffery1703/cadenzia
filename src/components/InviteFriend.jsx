import { useState } from 'react';
import { APP_URL, REFERRAL_REWARD_DAYS } from '../utils/config';

// Invite a friend — the real referral, and the actual growth engine: a targeted
// invite with a reward on both sides, and a taste of Premium that converts far
// better than a gate ever could. Decoupled from the daily limit on purpose.
export default function InviteFriend({ referralCode, referralCount = 0 }) {
  const [copied, setCopied] = useState(false);
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
      <h2 className="font-display text-2xl text-ink">Invite a friend</h2>
      <p className="mt-2 text-sm text-ink-soft">
        Share your link. When a friend joins through it, you both get {REFERRAL_REWARD_DAYS} days of
        Premium — uninterrupted listening and offline downloads.
      </p>

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
