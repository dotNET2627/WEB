export function PageHeading({ title, description }: { title: string; description: string }) {
  return (
    <header>
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      <p className="mt-1 text-sm text-[var(--muted)]">{description}</p>
    </header>
  );
}
