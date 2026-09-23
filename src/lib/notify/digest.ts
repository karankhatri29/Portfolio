import { groupSources, percentChange } from "@/lib/analytics/tracking";
import type { DashboardData } from "@/lib/analytics/repository";

function trend(current: number, previous: number, days: number) {
  const change = percentChange(current, previous);
  if (change === null) return `new, nothing in the previous ${days} days`;
  if (change === 0) return `unchanged from the previous ${days} days`;
  return `${change > 0 ? "up" : "down"} ${Math.abs(change)}% from the previous ${days} days`;
}

export function buildDigest(data: DashboardData, siteUrl: string, blogTitles: Record<string, string> = {}): { subject: string; text: string } {
  const { summary, days } = data;
  const lines: string[] = [
    `Your portfolio, last ${days} days`,
    "",
    `Page views: ${summary.views} (${trend(summary.views, summary.previous.views, days)})`,
    `Unique visitors: ${summary.visitors} (${trend(summary.visitors, summary.previous.visitors, days)})`,
    `Contact-link clicks: ${summary.contactClicks}`,
    `Messages: ${summary.messages}${summary.unreadMessages > 0 ? ` (${summary.unreadMessages} unread in total)` : ""}`,
  ];

  if (data.errors.total > 0) lines.push(`Errors: ${data.errors.total} logged, worth a look on the dashboard`);

  if (data.topPages.length > 0) {
    lines.push("", "Top pages:");
    data.topPages.slice(0, 3).forEach((page, index) => lines.push(`  ${index + 1}. ${page.path === "/" ? "Home" : page.path} - ${page.views} views`));
  }

  const source = groupSources(data.sources)[0];
  if (source) lines.push("", `Biggest source: ${source.label} (${source.visits} visits)`);

  const topPost = [...data.blog].sort((a, b) => b.views - a.views)[0];
  if (topPost && topPost.views > 0) lines.push(`Most read post: ${blogTitles[topPost.path] ?? topPost.path} (${topPost.views} views)`);

  lines.push("", `Open the dashboard: ${siteUrl.replace(/\/$/, "")}/admin/analytics`);

  return { subject: `Portfolio weekly digest: ${summary.views} views, ${summary.messages} ${summary.messages === 1 ? "message" : "messages"}`, text: lines.join("\n") };
}
