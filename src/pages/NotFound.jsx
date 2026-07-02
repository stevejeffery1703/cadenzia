import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Logo from '../components/Logo';

// Quiet, not apologetic. The same warmth as everywhere else on the site.
// Not in PAGE_META (there's no single canonical URL for arbitrary bad
// paths, and the Worker already reports a real 404 status for these — see
// serveStaticOrNotFound — so there's nothing here for a crawler to index).
export default function NotFound() {
  useEffect(() => {
    const prev = document.title;
    document.title = 'Page not found — Cadenzia';
    return () => {
      document.title = prev;
    };
  }, []);
  return (
    <main className="page-enter mx-auto flex min-h-[70vh] max-w-content flex-col items-center justify-center px-6 text-center">
      <Logo size={40} className="mb-6" />
      <h1 className="text-h1 text-ink">This page took a wrong turn.</h1>
      <p className="mt-4 text-lg font-light text-ink-soft">There's nothing here. Let's get you back.</p>
      <Link to="/" className="btn-primary mt-10">
        Return home
      </Link>
    </main>
  );
}
