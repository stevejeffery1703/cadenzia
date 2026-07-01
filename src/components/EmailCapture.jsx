import { useState } from 'react';
import { api } from '../utils/api';

// Optional, never forced. We only ever email about new music.
export default function EmailCapture({ compact = false }) {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await api('/email/subscribe', { method: 'POST', body: { email, consent: true } });
      setDone(true);
    } catch {
      setError('That did not save. Please try again.');
    }
  };

  if (done) {
    return <p className="text-sm text-ink-soft">Noted. We will only write about new music.</p>;
  }

  return (
    <form onSubmit={submit} className={compact ? 'flex gap-2' : 'mx-auto flex max-w-md gap-2'}>
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Hear about new tracks"
        className="flex-1 rounded-full border border-line bg-paper-raised px-4 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-accent"
      />
      <button type="submit" className="btn-ghost px-5 py-2.5">
        Notify me
      </button>
      {error && <p className="text-sm text-warm">{error}</p>}
    </form>
  );
}
