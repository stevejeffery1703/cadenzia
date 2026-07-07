// The current local-day stamp ("2026-7-6"), shared by the daily gate
// (useSession) and focus stats (useFocusStats) so the two can never disagree
// about when "today" resets. Local time on purpose — a listener's day rolls at
// their own midnight, not UTC.
export function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}
