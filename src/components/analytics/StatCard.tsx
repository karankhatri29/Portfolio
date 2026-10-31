import { percentChange } from "@/lib/analytics/tracking";

export function StatCard({ label, value, previous, days }: { label: string; value: number; previous: number; days: number }) {
  const change = percentChange(value, previous);
  const trend = change === null ? "New" : change === 0 ? "No change" : `${change > 0 ? "▲" : "▼"} ${Math.abs(change)}%`;
  const tone = change === null || change > 0 ? "text-accent" : change < 0 ? "text-[#ff8a80]" : "text-muted";

  return (
    <div className="relative overflow-hidden border border-accent/20 bg-ink/[0.035] p-5 backdrop-blur-xl">
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent to-transparent opacity-70" />
      <p className="text-sm font-medium text-muted">{label}</p>
      <p className="mt-3 font-display text-4xl font-semibold tabular-nums">{value.toLocaleString("en-US")}</p>
      <p className={`mt-2 text-sm ${tone}`}>
        {trend}
        <span className="text-muted"> vs previous {days} days</span>
      </p>
    </div>
  );
}
