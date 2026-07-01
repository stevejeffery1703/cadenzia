// The Cadenzia mark — a single complete sine wave. One period, one line, one
// colour. Sound at its most essential; less is more. Renders in the pine accent
// and keeps its aspect so it never distorts.
export default function Logo({ size = 34, className = '' }) {
  return (
    <svg
      width={size}
      height={Math.round((size * 24) / 36)}
      viewBox="0 0 36 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M3 12 C 8 4, 13 4, 18 12 C 23 20, 28 20, 33 12"
        stroke="var(--color-accent)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
