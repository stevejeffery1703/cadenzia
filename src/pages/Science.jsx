import { useDocumentHead } from '../hooks/useDocumentHead';

// The science, stated plainly. A real mechanism, an honest disclaimer, and
// pointers to research — no overclaiming.
const FREQUENCIES = [
  { wave: 'Delta', range: '0.5–4 Hz', state: 'Deep rest and recovery' },
  { wave: 'Theta', range: '4–8 Hz', state: 'Reverie, the edge of sleep' },
  { wave: 'Alpha', range: '8–14 Hz', state: 'Calm, relaxed attention' },
  { wave: 'Beta', range: '14–30 Hz', state: 'Active, engaged thinking' },
  { wave: 'Gamma', range: '30–100 Hz', state: 'Peak focus and flow' },
];

const STUDIES = [
  {
    label: 'Chaieb et al. (2015) — auditory beat stimulation and cognition',
    href: 'https://scholar.google.com/scholar?q=Chaieb+2015+binaural+beats+working+memory',
  },
  {
    label: 'Garcia-Argibay et al. (2019) — binaural beats, a meta-analysis',
    href: 'https://scholar.google.com/scholar?q=Garcia-Argibay+2019+binaural+beats+meta-analysis',
  },
  {
    label: 'Search: binaural beats and attention, randomised trials',
    href: 'https://scholar.google.com/scholar?q=binaural+beats+attention+randomised+controlled+trial',
  },
];

export default function Science() {
  useDocumentHead('/science');
  return (
    <main className="page-enter mx-auto max-w-3xl px-6 py-20">
      <h1 className="text-h1 text-ink">The science, plainly.</h1>

      <p className="mt-8 text-lg font-light leading-relaxed text-ink-soft">
        Play two slightly different frequencies, one in each ear, and the mind perceives a third —
        a <span className="text-ink">binaural beat</span> equal to the difference between them.
        Neural activity tends to drift toward that frequency, an effect known as{' '}
        <span className="text-ink">entrainment</span>. We compose with it, deliberately.
      </p>

      <h2 className="text-h2 mt-16 text-ink">A frequency guide</h2>
      <div className="panel mt-5 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="text-label text-ink-soft">
            <tr>
              <th className="px-5 py-4 font-medium">Brainwave</th>
              <th className="px-5 py-4 font-medium">Frequency</th>
              <th className="px-5 py-4 font-medium">Associated state</th>
            </tr>
          </thead>
          <tbody>
            {FREQUENCIES.map((f) => (
              <tr key={f.wave} className="border-t border-line">
                <td className="px-5 py-4 text-ink">{f.wave}</td>
                <td className="px-5 py-4 text-ink-soft">{f.range}</td>
                <td className="px-5 py-4 text-ink-soft">{f.state}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="text-h2 mt-16 text-ink">Research</h2>
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
          Binaural beats work best with headphones. The research suggests they can support focus,
          calm, and rest — but effects vary between people. This is music, not medicine. It is no
          substitute for professional care for sleep or anxiety.
        </p>
      </div>
    </main>
  );
}
