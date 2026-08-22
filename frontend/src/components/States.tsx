export function Loading({ label = "Loading…" }: { label?: string }) {
  return <p className="py-12 text-center text-sm text-ink-400">{label}</p>;
}

export function Empty({ title, hint, action }: {
  title: string; hint?: string; action?: React.ReactNode;
}) {
  return (
    <div className="card grid place-items-center gap-2 px-6 py-14 text-center">
      <p className="font-medium text-ink-700">{title}</p>
      {hint && <p className="max-w-sm text-sm text-ink-500">{hint}</p>}
      {action}
    </div>
  );
}

export function GroupBadges({ groups }: { groups: { key: string; count: number }[] }) {
  if (!groups.length) return null;
  return (
    <div className="mb-4 flex flex-wrap gap-2">
      {groups.slice(0, 12).map((g) => (
        <span key={g.key} className="chip bg-ink-100 text-ink-700">
          {g.key}
          <span className="text-ink-400">{g.count}</span>
        </span>
      ))}
    </div>
  );
}
