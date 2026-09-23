import { countryName, timeAgo } from "@/lib/analytics/format";
import type { RecentActivity } from "@/lib/analytics/repository";

const contactLabels: Record<string, string> = { email: "email", phone: "phone", github: "GitHub", linkedin: "LinkedIn" };

function describe(item: RecentActivity) {
  if (item.kind === "message") return `${item.detail} sent a message`;
  if (item.kind === "click") return `Clicked the ${contactLabels[item.detail] ?? item.detail} link`;
  return `Viewed ${item.path === "/" ? "Home" : item.path}`;
}

export function ActivityFeed({ items, now }: { items: RecentActivity[]; now: Date }) {
  if (items.length === 0) return <p className="mt-4 text-sm text-muted">No activity recorded yet.</p>;

  return (
    <ul className="mt-4 divide-y divide-ink/10 border border-ink/10">
      {items.map((item, index) => (
        <li key={`${item.at}-${index}`} className="flex flex-wrap items-baseline justify-between gap-2 px-4 py-2 text-sm">
          <span className={item.kind === "pageview" ? "" : "font-semibold"}>{describe(item)}</span>
          <span className="text-xs text-muted">
            {[item.city, item.country ? countryName(item.country) : "", item.device].filter(Boolean).map((part) => `${part} · `).join("")}
            <time dateTime={item.at}>{timeAgo(item.at, now)}</time>
          </span>
        </li>
      ))}
    </ul>
  );
}
