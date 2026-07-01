// Session history for subscribers. Quiet figures, for the listener's own eyes —
// never sold, never shared. No streaks, no badges, no gamification; this audience
// finds that patronising.
export default function StatsPanel({ stats }) {
  const items = [
    { label: 'Hours of focus', value: stats?.hours ?? '—' },
    { label: 'Sessions', value: stats?.sessions ?? '—' },
    { label: 'Most listened', value: stats?.favourite ?? '—' },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {items.map((it) => (
        <div key={it.label} className="panel p-6">
          <div className="font-display text-3xl font-light text-ink">{it.value}</div>
          <div className="text-caption mt-1">{it.label}</div>
        </div>
      ))}
    </div>
  );
}
