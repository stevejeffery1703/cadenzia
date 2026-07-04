import { useDocumentHead } from '../hooks/useDocumentHead';

// The science, stated plainly. Real, modest mechanisms — no brainwave
// entrainment, no binaural-beats claims, no numbers we cannot stand behind.
const PRINCIPLES = [
  {
    title: 'No words',
    body: 'Every track is instrumental. Speech and lyrics pull on the same part of the mind you use to read and write, so there are none here.',
  },
  {
    title: 'Nothing sudden',
    body: 'Attention orients automatically to abrupt sound. These pieces move slowly and evenly, with no jolts to pull you out of the work.',
  },
  {
    title: 'A steady floor',
    body: 'Consistent, even sound masks the intermittent noise — a passing voice, a notification — that would otherwise break your concentration.',
  },
  {
    title: 'The right energy',
    body: 'Deep Focus, Energy, Creativity, and Calm each hold a different level of arousal, so you can match the sound to the work in front of you.',
  },
];

const STUDIES = [
  {
    label: 'The irrelevant-speech effect — why lyrics disrupt reading and writing',
    href: 'https://scholar.google.com/scholar?q=irrelevant+speech+effect+working+memory',
  },
  {
    label: 'Sound masking and concentration in shared workspaces',
    href: 'https://scholar.google.com/scholar?q=sound+masking+speech+privacy+concentration+office',
  },
  {
    label: 'Background music, arousal, and cognitive performance',
    href: 'https://scholar.google.com/scholar?q=background+music+arousal+cognitive+performance',
  },
];

export default function Science() {
  useDocumentHead('/science');
  return (
    <main className="page-enter mx-auto max-w-3xl px-6 py-20">
      <h1 className="text-h1 text-ink">The science, plainly.</h1>

      <p className="mt-8 text-lg font-light leading-relaxed text-ink-soft">
        There is no magic frequency, and we do not claim one. The aim is quieter and more
        honest: music <span className="text-ink">engineered to stay out of your way</span>.
        No words, nothing sudden, a steady acoustic floor that masks distraction — so the
        loudest thing in the room is the work.
      </p>

      <h2 className="text-h2 mt-16 text-ink">How it is made</h2>
      <div className="panel mt-5 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="text-label text-ink-soft">
            <tr>
              <th className="px-5 py-4 font-medium">Principle</th>
              <th className="px-5 py-4 font-medium">Why it helps</th>
            </tr>
          </thead>
          <tbody>
            {PRINCIPLES.map((p) => (
              <tr key={p.title} className="border-t border-line align-top">
                <td className="whitespace-nowrap px-5 py-4 text-ink">{p.title}</td>
                <td className="px-5 py-4 text-ink-soft">{p.body}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="text-h2 mt-16 text-ink">The research</h2>
      <ul className="mt-5 space-y-3">
        {STUDIES.map((s) => (
          <li key={s.href}>
            <a
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent underline-offset-4 transition-colors hover:text-ink hover:underline"
            >
              {s.label}
            </a>
          </li>
        ))}
      </ul>

      <div className="panel mt-16 p-7">
        <h3 className="font-display text-xl text-ink">An honest note</h3>
        <p className="mt-3 text-sm leading-relaxed text-ink-soft">
          Music helps many people concentrate — but not everyone, and not for every task. The
          research is genuinely mixed, and the effect depends on the person and the work. This is
          music, not medicine. It is no substitute for professional care for sleep or anxiety.
        </p>
      </div>
    </main>
  );
}
