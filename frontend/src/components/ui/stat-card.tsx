export function StatCard({ label, value, description }: { label: string; value: string; description: string }) {
  return (
    <article className="rounded-xl border border-[var(--border)] bg-white p-5 shadow-sm">
      <p className="text-sm text-[var(--muted)]">{label}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
      <p className="mt-2 text-xs text-[var(--muted)]">{description}</p>
    </article>
  );
}
