import { Link } from 'react-router-dom';
import { getCategory } from '../utils/tracks';
import { APP_NAME, PRICE, DOWNLOAD_EXPIRY_DAYS } from '../utils/config';
import { useDocumentHead } from '../hooks/useDocumentHead';
import Artwork from '../components/Artwork';
import Logo from '../components/Logo';
import PlayCounter from '../components/PlayCounter';

// The landing page. It has three seconds to earn respect. Warm, sparse, and
// confident — let the artwork and the space do the work.
export default function Home() {
  useDocumentHead({
    title: 'Cadenzia — Find your cadence',
    description: 'Curated audio engineered for deep concentration, flow state, and creative work.',
  });
  return (
    <main className="page-enter">
      <Hero />
      <Previews />
      <Proof />
      <Pricing />
      <Footer />
    </main>
  );
}

function Hero() {
  return (
    <section className="mx-auto flex min-h-[76vh] max-w-content flex-col items-center justify-center px-6 text-center">
      <Logo size={52} className="mb-7" />
      <h1 className="text-display text-ink">{APP_NAME}</h1>
      <p className="mt-6 text-xl font-light text-ink-soft">Find your cadence.</p>
      <Link to="/app" className="btn-primary mt-12">
        Begin listening
      </Link>
      <p className="text-caption mt-5">No account needed to start.</p>
    </section>
  );
}

function Previews() {
  // Three categories, artwork forward. Let the work speak; no feature lists.
  const featured = ['deep-focus', 'flow-state', 'restoration'].map(getCategory);
  return (
    <section className="mx-auto max-w-content px-6 py-20">
      <div className="grid gap-8 sm:grid-cols-3">
        {featured.map((c) => (
          <Link key={c.id} to="/app" className="group block">
            <Artwork
              seed={`${c.id}-preview`}
              style={c.style}
              size={520}
              animate={false}
              className="w-full border border-line transition-transform duration-500 ease-calm group-hover:-translate-y-0.5"
            />
            <h2 className="mt-5 font-display text-2xl text-ink">{c.name}</h2>
            <p className="mt-1 text-sm text-ink-soft">{c.tagline}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

function Proof() {
  // A single quiet line. Renders nothing until the number is real and large
  // enough to persuade.
  return (
    <section className="mx-auto max-w-content px-6 pb-4 text-center">
      <PlayCounter />
    </section>
  );
}

function Pricing() {
  return (
    <section className="mx-auto max-w-content px-6 py-20">
      <div className="panel mx-auto max-w-md p-9 text-center">
        <h2 className="text-h2 text-ink">Listen without limits.</h2>
        <div className="mt-6 flex items-baseline justify-center gap-2">
          <span className="font-display text-5xl font-light text-ink">${PRICE.amount}</span>
          <span className="text-ink-soft">/ month</span>
        </div>
        <p className="mx-auto mt-5 max-w-xs text-sm leading-relaxed text-ink-soft">
          Every track. No hourly pause. Downloads that stay offline for {DOWNLOAD_EXPIRY_DAYS} days.
          Cancel anytime.
        </p>
        <Link to="/app?subscribe=1" className="btn-primary mt-8 w-full">
          Subscribe — {PRICE.label}
        </Link>
        <p className="text-caption mt-4">Free to begin. An hour of open listening in every session.</p>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-content flex-col items-center gap-6 px-6 py-12 text-center">
        <Link to="/" className="flex items-center gap-2.5">
          <Logo size={24} />
          <span className="font-display text-2xl text-ink">{APP_NAME}</span>
        </Link>
        <div className="flex gap-7">
          {[
            ['/science', 'Science'],
            ['/privacy', 'Privacy'],
            ['/terms', 'Terms'],
            ['/account', 'Account'],
          ].map(([to, label]) => (
            <Link key={to} to={to} className="text-label text-ink-soft hover:text-ink">
              {label}
            </Link>
          ))}
        </div>
        <p className="text-caption">© {new Date().getFullYear()} {APP_NAME}. No ads. No data sold.</p>
      </div>
    </footer>
  );
}
