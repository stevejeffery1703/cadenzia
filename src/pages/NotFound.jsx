import { Link } from 'react-router-dom';
import Logo from '../components/Logo';

// Quiet, not apologetic. The same warmth as everywhere else on the site.
export default function NotFound() {
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
