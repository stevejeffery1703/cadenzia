import { APP_NAME } from '../utils/config';
import { useDocumentHead } from '../hooks/useDocumentHead';
import Section from '../components/LegalSection';

// Plain English. Short. Honest. Privacy is a feature, not a policy.
export default function Privacy() {
  useDocumentHead('/privacy');
  return (
    <main className="page-enter mx-auto max-w-2xl px-6 py-20">
      <h1 className="text-h1 text-ink">Privacy</h1>
      <p className="mt-8 text-lg font-light leading-relaxed text-ink-soft">
        {APP_NAME} is built to respect your attention and your data. Here is exactly what we do, in
        plain English.
      </p>

      <Section title="What we store">
        Your email, if you sign in. Your subscription status (and a customer ID from our payment
        processor, if you subscribe). Your listening sessions — which track, for how long. If someone
        joins through your invite link, a record connecting the two accounts. That&rsquo;s all.
      </Section>

      <Section title="What we never do">
        No ads. No third-party analytics. No fingerprinting. We do not sell or share your data, ever.
        Your listening history is for you.
      </Section>

      <Section title="Cookies and storage">
        We keep you signed in using your browser&rsquo;s local storage — not tracking cookies. There
        are no advertising, analytics, or third-party cookies of any kind, so there is nothing to
        consent to.
      </Section>

      <Section title="Deleting your data">
        Open your account and choose “Delete everything”. It removes your account, listening history,
        and email record, and cancels any subscription — immediately. The one thing we can&rsquo;t erase
        is the transaction record our payment processor (Stripe) is required by law to keep; everything
        on our side is gone.
      </Section>

      <Section title="Email">
        We write only about new music, and only if you ask. Every message has a one-click
        unsubscribe.
      </Section>
    </main>
  );
}
