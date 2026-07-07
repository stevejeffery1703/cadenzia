import { useCallback, useEffect, useState } from 'react';
import { getCategory } from '../utils/tracks';

// Focus stats — the quiet record of what a listener has actually done, kept so
// they can share it as a small, understated achievement ("3 hours of deep focus
// today"). Stored locally only; never sent anywhere. This is the positive
// surface the sharing lives on — earned, not extracted at a gate.
//
// Counts for everyone, subscribers included: the point is the achievement, not
// the tier. A day's tally resets at local midnight; an all-time tally persists.

const KEY = 'cad_focus_v1';

// Below this, a category's time today isn't really an achievement worth
// offering to share.
export const MIN_HEADLINE_SECONDS = 20 * 60;

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function load() {
  let stored = {};
  try {
    stored = JSON.parse(localStorage.getItem(KEY) || '{}');
  } catch {
    stored = {};
  }
  const allTime = stored.allTime || {};
  if (stored.day !== today()) return { day: today(), today: {}, allTime };
  return { day: stored.day, today: stored.today || {}, allTime };
}

// A friendly, honest phrase for a span of focus. Rounded to read naturally on a
// share card — nearest 5 minutes under an hour, nearest quarter-hour above.
export function focusPhrase(seconds) {
  const totalMin = Math.max(0, Math.round(seconds / 60));
  if (totalMin < 60) {
    const m = Math.max(5, Math.round(totalMin / 5) * 5);
    return `${m} minutes`;
  }
  const q = Math.round(totalMin / 15) * 15;
  const h = Math.floor(q / 60);
  const m = q % 60;
  const hours = `${h} hour${h > 1 ? 's' : ''}`;
  return m === 0 ? hours : `${hours} ${m} minutes`;
}

// "3 hours of deep focus" — the flattering line, lowercased category on purpose
// so it reads as a quiet statement, not a shout.
export function focusHeadline(categoryId, seconds) {
  const category = getCategory(categoryId);
  if (!category) return null;
  return `${focusPhrase(seconds)} of ${category.name.toLowerCase()}`;
}

export function useFocusStats() {
  const [state, setState] = useState(load);

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(state));
  }, [state]);

  const addSecond = useCallback((categoryId) => {
    if (!categoryId) return;
    setState((prev) => {
      const base = prev.day === today() ? prev : { day: today(), today: {}, allTime: prev.allTime };
      return {
        day: base.day,
        today: { ...base.today, [categoryId]: (base.today[categoryId] || 0) + 1 },
        allTime: { ...base.allTime, [categoryId]: (base.allTime[categoryId] || 0) + 1 },
      };
    });
  }, []);

  // Today's categories, most-focused first.
  const byCategoryToday = Object.entries(state.today)
    .map(([categoryId, seconds]) => ({ categoryId, seconds }))
    .sort((a, b) => b.seconds - a.seconds);

  const totalTodaySeconds = byCategoryToday.reduce((sum, c) => sum + c.seconds, 0);

  // The headline achievement: the category with the most time today, once it
  // clears the "worth sharing" threshold.
  const top = byCategoryToday[0];
  const headline =
    top && top.seconds >= MIN_HEADLINE_SECONDS
      ? {
          categoryId: top.categoryId,
          seconds: top.seconds,
          text: focusHeadline(top.categoryId, top.seconds),
        }
      : null;

  return { addSecond, byCategoryToday, totalTodaySeconds, headline };
}
