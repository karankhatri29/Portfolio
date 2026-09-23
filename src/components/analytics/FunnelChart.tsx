import type { Funnel } from "@/lib/analytics/repository";
import { percentOf } from "@/lib/analytics/format";

export function FunnelChart({ funnel }: { funnel: Funnel }) {
  if (funnel.visitors === 0) return <p className="mt-4 text-sm text-muted">No visitors recorded in this period yet.</p>;

  const steps = [
    { label: "Visited the site", value: funnel.visitors },
    { label: "Opened a project", value: funnel.viewedProject },
    { label: "Reached out (message or contact click)", value: funnel.reachedOut },
  ];

  return (
    <ol className="mt-4 space-y-4">
      {steps.map((step, index) => {
        const share = percentOf(step.value, funnel.visitors);
        return (
          <li key={step.label}>
            <div className="flex items-baseline justify-between gap-4 text-sm">
              <span className="font-medium">{index + 1}. {step.label}</span>
              <span className="shrink-0 tabular-nums text-muted">{step.value.toLocaleString("en-US")}{index > 0 ? ` · ${share}% of visitors` : ""}</span>
            </div>
            <div className="mt-1 h-3 bg-ink/10" aria-hidden="true">
              <div className="h-3 bg-accent" style={{ width: `${step.value === 0 ? 0 : Math.max(share, 2)}%` }} />
            </div>
          </li>
        );
      })}
    </ol>
  );
}
