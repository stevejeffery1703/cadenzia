import { useEffect, useState } from 'react';
import { getPlayCount } from '../utils/plays';
import { PLAY_COUNTER_THRESHOLD } from '../utils/config';

// Honest social proof: total tracks played across everyone, counted server-side.
// Held back entirely until the number is large enough to persuade rather than
// undermine — a counter reading "12" would do more harm than good. No live
// ticker; it simply reflects the truth on page load.
export default function PlayCounter({ className = '' }) {
  const [count, setCount] = useState(null);

  useEffect(() => {
    let live = true;
    getPlayCount().then((c) => {
      if (live) setCount(c);
    });
    return () => {
      live = false;
    };
  }, []);

  if (count == null || count < PLAY_COUNTER_THRESHOLD) return null;

  return (
    <p className={`text-sm text-ink-soft ${className}`}>
      {count.toLocaleString('en-US')} tracks played, and counting.
    </p>
  );
}
