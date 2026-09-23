import Link from "next/link";

import { auth } from "@/auth";
import { AdminGate } from "@/components/AdminGate";
import { BarList } from "@/components/analytics/BarList";
import { MessageInbox } from "@/components/analytics/MessageInbox";
import { StatCard } from "@/components/analytics/StatCard";
import { TrafficChart } from "@/components/analytics/TrafficChart";
import { getDashboardData } from "@/lib/analytics/repository";
import { groupSources, percentChange } from "@/lib/analytics/tracking";
import { listBlogPosts } from "@/lib/content/blog";

const RANGES = [7, 30, 90];
const DEFAULT_RANGE = 30;

const contactLabels: Record<string, string> = { email: "Email", phone: "Phone", github: "GitHub", linkedin: "LinkedIn" };

function readDays(value: string | undefined) {
  const days = Number(value);
  return RANGES.includes(days) ? days : DEFAULT_RANGE;
}

function pageLabel(path: string) {
  return path === "/" ? "Home" : path;
}

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const session = await auth();
  const days = readDays((await searchParams).days);
  const data = session?.role === "Admin" ? await getDashboardData(days) : null;

  return (
    <main className="mx-auto max-w-5xl px-5 py-20 lg:px-8 lg:py-28">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">Admin</p>
      <h1 className="mt-4 font-display text-5xl font-semibold tracking-tight sm:text-6xl">Analytics</h1>
      <div className="mt-14">
        <AdminGate session={session}>{data ? <Dashboard data={data} days={days} /> : null}</AdminGate>
      </div>
    </main>
  );
}

function Dashboard({ data, days }: { data: NonNullable<Awaited<ReturnType<typeof getDashboardData>>>; days: number }) {
  const { summary } = data;
  const blogViews = new Map(data.blog.map((row) => [row.path, row]));
  const posts = listBlogPosts()
    .map((post) => {
      const stat = blogViews.get(`/blog/${post.slug}`);
      return { title: post.title, slug: post.slug, views: stat?.views ?? 0, visitors: stat?.visitors ?? 0, previous: stat?.previousViews ?? 0 };
    })
    .sort((a, b) => b.views - a.views);
  const totalContactClicks = data.contactClicks.reduce((sum, row) => sum + row.clicks, 0);

  return (
    <div className="space-y-14">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <nav aria-label="Date range" className="flex gap-2">
          {RANGES.map((range) => (
            <Link key={range} href={`/admin/analytics?days=${range}`} aria-current={range === days ? "page" : undefined} className={`border border-ink/20 px-3 py-1 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-accent ${range === days ? "bg-accent text-paper" : ""}`}>
              {range} days
            </Link>
          ))}
        </nav>
        <Link href="/admin" className="text-sm font-semibold text-accent underline underline-offset-4">Edit content</Link>
      </div>

      <section aria-label="Summary" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Page views" value={summary.views} previous={summary.previous.views} days={days} />
        <StatCard label="Unique visitors" value={summary.visitors} previous={summary.previous.visitors} days={days} />
        <StatCard label="Contact clicks" value={summary.contactClicks} previous={summary.previous.contactClicks} days={days} />
        <StatCard label="Messages" value={summary.messages} previous={summary.previous.messages} days={days} />
      </section>

      <section aria-labelledby="traffic-title">
        <h2 id="traffic-title" className="font-display text-2xl font-semibold">Traffic</h2>
        <TrafficChart data={data.daily} />
      </section>

      <div className="grid gap-14 lg:grid-cols-2">
        <section aria-labelledby="pages-title">
          <h2 id="pages-title" className="font-display text-2xl font-semibold">Top pages</h2>
          <BarList unit="views" emptyText="No visits recorded yet." items={data.topPages.map((page) => ({ label: pageLabel(page.path), value: page.views, detail: `${page.visitors} visitors` }))} />
        </section>
        <section aria-labelledby="sources-title">
          <h2 id="sources-title" className="font-display text-2xl font-semibold">Where visitors come from</h2>
          <BarList unit="visits" emptyText="No visits recorded yet." items={groupSources(data.sources).map((source) => ({ label: source.label, value: source.visits }))} />
          <p className="mt-3 text-xs text-muted">Tip: add <code>?ref=linkedin</code> or <code>?ref=resume-june</code> to a link you share to see it here by name.</p>
        </section>
      </div>

      <section aria-labelledby="blog-title">
        <h2 id="blog-title" className="font-display text-2xl font-semibold">Blog performance</h2>
        {posts.length === 0 ? <p className="mt-4 text-sm text-muted">No blog posts yet.</p> : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[32rem] text-left text-sm">
              <thead className="border-b border-ink/20 text-xs uppercase tracking-[0.12em] text-muted">
                <tr><th scope="col" className="py-2 pr-4">Post</th><th scope="col" className="py-2 pr-4 text-right">Views</th><th scope="col" className="py-2 pr-4 text-right">Readers</th><th scope="col" className="py-2 text-right">Trend</th></tr>
              </thead>
              <tbody className="divide-y divide-ink/10">
                {posts.map((post) => {
                  const change = percentChange(post.views, post.previous);
                  return (
                    <tr key={post.slug}>
                      <th scope="row" className="py-3 pr-4 font-medium"><Link href={`/blog/${post.slug}`} className="hover:text-accent">{post.title}</Link></th>
                      <td className="py-3 pr-4 text-right tabular-nums">{post.views}</td>
                      <td className="py-3 pr-4 text-right tabular-nums">{post.visitors}</td>
                      <td className="py-3 text-right tabular-nums text-muted">{change === null ? "New" : change === 0 ? "-" : `${change > 0 ? "▲" : "▼"} ${Math.abs(change)}%`}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section aria-labelledby="contact-title">
        <h2 id="contact-title" className="font-display text-2xl font-semibold">Outreach</h2>
        <p className="mt-2 text-sm text-muted">
          {summary.messages} {summary.messages === 1 ? "message" : "messages"} and {totalContactClicks} contact-link {totalContactClicks === 1 ? "click" : "clicks"} in the last {days} days
          {summary.unreadMessages > 0 ? ` · ${summary.unreadMessages} unread` : ""}. A click means someone tapped a contact link; it does not prove they sent anything.
        </p>
        <BarList unit="clicks" emptyText="No contact-link clicks yet." items={data.contactClicks.map((row) => ({ label: contactLabels[row.target] ?? row.target, value: row.clicks, detail: `${row.visitors} visitors` }))} />
        <h3 className="mt-10 text-lg font-semibold">Messages</h3>
        <MessageInbox initialMessages={data.messages} />
      </section>
    </div>
  );
}
