import { APP_NAME } from '../utils/config';
import { useDocumentHead } from '../hooks/useDocumentHead';
import Section from '../components/LegalSection';

// Plain English. Short. Honest. Privacy is a feature, not a policy.
export default function Privacy() {
  useDocumentHead({
    title: 'Privacy — Cadenzia',
    description: 'What Cadenzia stores, what it never does, and how to delete your data.',
  });
  return (
    <main className="page-enter mx-auto max-w-2xl px-6 py-20">
      <h1 className="text-h1 text-ink">Privacy</h1>
      <p className="mt-8 text-lg font-light leading-relaxed text-ink-soft">
        {APP_NAME} is built to respect your attention and your data. Here is exactly what we do, in
        plain English.
      </p>

      <Section title="What we store">
        Your email, if you sign in. Your subscription status. Your listening sessions — which track,
        for how long. Nothing more.
      </Section>

      <Section title="What we never do">
        No ads. No third-party analytics. No fingerprinting. We do not sell or share your data, ever.
        Your listening history is for you.
      </Section>

      <Section title="Cookies">Only what keeps you signed in. Nothing for tracking.</Section>

      <Section title="Deleting your data">
        Open your account and choose “Delete everything”. It removes your account, listening history,
        and email record, and cancels any subscription — immediately.
      </Section>

      <Section title="Email">
        We write only about new music, and only if you ask. Every message has a one-click
        unsubscribe.
      </Section>
    </main>
  );
}
