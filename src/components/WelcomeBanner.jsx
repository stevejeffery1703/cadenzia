import { useState } from 'react';

const KEY = 'cad_welcome';

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// Shown once to a listener who just created their account, announcing the free
// first week their signup unlocked — two weeks if a friend referred them. Calm
// and dismissible; clears itself so it never nags.
export default function WelcomeBanner() {
  const [welcome, setWelcome] = useState(read);
  if (!welcome) return null;

  const dismiss = () => {
    localStorage.removeItem(KEY);
    setWelcome(null);
  };

  const referred = !!welcome.referred;

  return (
    <div className="panel mb-8 flex items-start gap-4 p-5">
      <div className="flex-1">
        <p className="font-display text-lg text-ink">
          {referred ? 'A friend gave you a head start.' : 'Welcome to Cadenzia.'}
        </p>
        <p className="mt-1 text-sm text-ink-soft">
          {referred
            ? 'Two weeks of Premium, on them — no daily limit, and every track downloads. Enjoy it.'
            : 'Your first week of Premium is on us — no daily limit, and every track downloads. Enjoy it.'}
        </p>
      </div>
      <button
        type="button"
        onClick={dismiss}
        className="text-label shrink-0 text-ink-soft hover:text-ink"
      >
        Got it
      </button>
    </div>
  );
}
