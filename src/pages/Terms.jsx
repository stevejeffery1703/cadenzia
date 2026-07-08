import { APP_NAME, PRICE } from '../utils/config';
import { useDocumentHead } from '../hooks/useDocumentHead';
import Section from '../components/LegalSection';

// Same voice as Privacy — plain English, short sentences. The summary at the
// top is the part almost everyone needs; the full terms below exist for
// anyone who wants the complete picture.
export default function Terms() {
  useDocumentHead('/terms');
  return (
    <main className="page-enter mx-auto max-w-2xl px-6 py-20">
      <h1 className="text-h1 text-ink">Terms</h1>
      <p className="mt-8 text-lg font-light leading-relaxed text-ink-soft">
        The short version of the deal, in plain English — followed by the complete terms, for anyone
        who wants every detail.
      </p>

      <Section title="The deal">
        Every track is free to stream. Each day gives you an hour of open listening; after that,
        subscribe to keep going, or come back tomorrow. Subscribing removes the daily limit for good
        and adds offline downloads.
      </Section>

      <Section title="Billing">
        Subscriptions are ${PRICE.amount} a month, billed through Stripe. Cancel anytime from your
        account — no long-term commitment, no retention calls.
      </Section>

      <Section title="Your account">
        One email address, no password. Sign-in codes expire in 10 minutes. Delete your account
        anytime and everything on our side goes with it, immediately — see Privacy for the one
        exception (records our payment processor must keep by law).
      </Section>

      <Section title="Downloads">
        A subscriber perk, trust-based rather than locked down. They're for your own offline
        listening — not for resale or redistribution.
      </Section>

      <Section title="If something breaks">
        We work to keep {APP_NAME} available and reliable, but can't promise it will never go down or
        that every feature will exist forever.
      </Section>

      <div className="mt-16 border-t border-line pt-10">
        <p className="text-label text-ink-soft">In full</p>
        <p className="mt-3 leading-relaxed text-ink-soft">
          The complete terms below cover the same ground as the summary above, with the detail a
          formal agreement needs. By using {APP_NAME}, you agree to these terms.
        </p>
      </div>

      <Section title="1. Eligibility">
        You need to be old enough to enter a binding agreement in your country — generally 18, or 13
        or older with a parent or guardian's permission. By using {APP_NAME}, you're confirming that's
        true of you.
      </Section>

      <Section title="2. Accounts">
        Signing in is optional for free listening but required to subscribe, download, or keep a
        listening history. You're responsible for keeping access to your email address secure, since
        that's how sign-in codes are delivered. Tell us if you think your account has been accessed
        without your permission.
      </Section>

      <Section title="3. Subscriptions and billing">
        Subscriptions are ${PRICE.amount} a month and renew automatically until you cancel. Payment
        is handled entirely by Stripe — we never see or store your card details. If we ever change the
        price, we'll tell current subscribers in advance; the new price applies from your next billing
        cycle. Cancelling stops future renewals but doesn't refund the current period, except where we
        decide otherwise or the law requires it.
      </Section>

      <Section title="4. Acceptable use">
        Use {APP_NAME} like a person, not a script: no scraping or bulk-downloading the catalogue, no
        automating the free-tier session gate, no reselling or redistributing tracks or artwork, no
        reverse-engineering the audio or app, and no impersonating someone else or misusing the
        sign-in system. We can suspend or close accounts that do these things.
      </Section>

      <Section title="5. Content and ownership">
        The music, artwork, and writing on {APP_NAME} belong to us (or our licensors). Subscribing or
        downloading gives you a personal licence to listen — it doesn't transfer ownership or give you
        the right to redistribute, sync, or sell anything you hear or see here.
      </Section>

      <Section title="6. Sharing">
        You can share your own listening milestones as an image if you like. It's optional and
        personal — nothing is ever gated behind sharing, and we don't ask anything in return.
      </Section>

      <Section title="7. Changes and availability">
        We're a small, evolving product. We may add, change, or remove features, and we don't
        guarantee uninterrupted access — maintenance, outages, or the occasional bug can happen. We'll
        use reasonable care to keep disruption minor.
      </Section>

      <Section title="8. Ending your access">
        You can stop using {APP_NAME} and delete your account at any time from the Account page. We
        can suspend or terminate accounts that break section 4, with notice where practical.
      </Section>

      <Section title="9. No warranty">
        {APP_NAME} is provided as-is. The Science page describes real, studied mechanisms, but we
        don't promise a specific outcome for you personally — attention and focus vary from person to
        person.
      </Section>

      <Section title="10. Limitation of liability">
        To the extent the law allows, our liability to you for any claim relating to {APP_NAME} is
        limited to the amount you paid us in the twelve months before the claim. We're not liable for
        indirect or consequential losses, like lost productivity or lost data.
      </Section>

      <Section title="11. Governing law">
        These terms are governed by the laws of the State of Texas, USA, without regard to
        conflict-of-law principles. {APP_NAME} is operated from Texas and intended for use in the
        United States.
      </Section>

      <Section title="12. Changes to these terms">
        If we update these terms in a meaningful way, we'll change the date below and, where the
        change is significant, let subscribers know by email. Continuing to use {APP_NAME} after that
        means you accept the update.
      </Section>

      <Section title="Contact">
        Questions about these terms — write to hello@cadenzia.app.
      </Section>

      <p className="text-caption mt-12">Last updated 8 July 2026.</p>
    </main>
  );
}
