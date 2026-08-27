// The current local-day stamp ("2026-7-6"), used by the local focus stats
// (useFocusStats) to know when "today" resets. Local time on purpose — a
// listener's day rolls at their own midnight, not UTC.
export function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}
