// Shared building block for Privacy and Terms — a label-style heading over a
// plain paragraph. Keeps both pages visually identical without duplicating markup.
export default function LegalSection({ title, children }) {
  return (
    <div className="mt-10">
      <h2 className="text-label text-ink-soft">{title}</h2>
      <p className="mt-2 leading-relaxed text-ink-soft">{children}</p>
    </div>
  );
}
