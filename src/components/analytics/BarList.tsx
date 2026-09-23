export type BarItem = { label: string; value: number; detail?: string };

export function BarList({ items, emptyText, unit }: { items: BarItem[]; emptyText: string; unit: string }) {
  if (items.length === 0) return <p className="mt-4 text-sm text-muted">{emptyText}</p>;

  const max = Math.max(...items.map((item) => item.value), 1);

  return (
    <ul className="mt-4 space-y-3">
      {items.map((item) => (
        <li key={item.label}>
          <div className="flex items-baseline justify-between gap-4 text-sm">
            <span className="min-w-0 truncate font-medium">{item.label}</span>
            <span className="shrink-0 tabular-nums text-muted">
              {item.value.toLocaleString("en-US")} {unit}
              {item.detail ? ` · ${item.detail}` : ""}
            </span>
          </div>
          <div className="mt-1 h-2 bg-ink/10" aria-hidden="true">
            <div className="h-2 bg-accent" style={{ width: `${Math.max((item.value / max) * 100, 2)}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
