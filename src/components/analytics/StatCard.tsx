import { percentChange } from "@/lib/analytics/tracking";

export function StatCard({ label, value, previous, days }: { label: string; value: number; previous: number; days: number }) {
  const change = percentChange(value, previous);
  const trend = change === null ? "New" : change === 0 ? "No change" : `${change > 0 ? "▲" : "▼"} ${Math.abs(change)}%`;
  const tone = change === null || change > 0 ? "text-accent" : change < 0 ? "text-red-700" : "text-muted";

  return (
    <div className="border border-ink/10 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">{label}</p>
      <p className="mt-3 font-display text-4xl font-semibold tabular-nums">{value.toLocaleString("en-US")}</p>
      <p className={`mt-2 text-sm ${tone}`}>
        {trend}
        <span className="text-muted"> vs previous {days} days</span>
      </p>
    </div>
  );
}
