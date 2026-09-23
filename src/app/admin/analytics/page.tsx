import Link from "next/link";

import { auth } from "@/auth";
import { AdminGate } from "@/components/AdminGate";
import { ActivityFeed } from "@/components/analytics/ActivityFeed";
import { BarList } from "@/components/analytics/BarList";
import { FunnelChart } from "@/components/analytics/FunnelChart";
import { MessageInbox } from "@/components/analytics/MessageInbox";
import { StatCard } from "@/components/analytics/StatCard";
import { TrafficChart } from "@/components/analytics/TrafficChart";
import { countryName, formatDuration, percentOf, plural, timeAgo } from "@/lib/analytics/format";
import { getDashboardData } from "@/lib/analytics/repository";
import { groupSources, percentChange } from "@/lib/analytics/tracking";
import { listBlogPosts } from "@/lib/content/blog";

const RANGES = [7, 30, 90];
const DEFAULT_RANGE = 30;

const contactLabels: Record<string, string> = { email: "Email", phone: "Phone", github: "GitHub", linkedin: "LinkedIn", booking: "Book a call" };

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
        <AdminGate session={session}>{data ? <Dashboard data={data} days={days} now={new Date()} /> : null}</AdminGate>
      </div>
    </main>
  );
}

function Dashboard({ data, days, now }: { data: NonNullable<Awaited<ReturnType<typeof getDashboardData>>>; days: number; now: Date }) {
  const { summary } = data;
  const blogViews = new Map(data.blog.map((row) => [row.path, row]));
  const engagement = new Map(data.engagement.map((row) => [row.path, row]));
  const posts = listBlogPosts()
    .map((post) => {
      const stat = blogViews.get(`/blog/${post.slug}`);
      return { title: post.title, slug: post.slug, views: stat?.views ?? 0, visitors: stat?.visitors ?? 0, previous: stat?.previousViews ?? 0, reading: engagement.get(`/blog/${post.slug}`) };
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
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-semibold">
          <a href={`/api/export?type=events&days=${days}`} download className="text-accent underline underline-offset-4">Download events (CSV)</a>
          <a href="/api/export?type=messages" download className="text-accent underline underline-offset-4">Download messages (CSV)</a>
          <Link href="/admin" className="text-accent underline underline-offset-4">Edit content</Link>
        </div>
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

      <section aria-labelledby="funnel-title">
        <h2 id="funnel-title" className="font-display text-2xl font-semibold">Visitor journey</h2>
        <p className="mt-2 text-sm text-muted">Of the people who visited, how many opened a project and how many got in touch. Visitors are counted per day, so someone returning on another day counts again.</p>
        <FunnelChart funnel={data.funnel} />
      </section>

      <section aria-labelledby="behavior-title">
        <h2 id="behavior-title" className="font-display text-2xl font-semibold">How people move through the site</h2>
        <div className="mt-2 grid gap-x-14 gap-y-10 md:grid-cols-2">
          <div>
            <h3 className="text-lg font-semibold">Where visits start</h3>
            <BarList unit="visits" emptyText="No visits recorded yet." items={data.behavior.entryPages.map((row) => ({ label: pageLabel(row.path), value: row.count }))} />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Where visits end</h3>
            <BarList unit="visits" emptyText="No visits recorded yet." items={data.behavior.exitPages.map((row) => ({ label: pageLabel(row.path), value: row.count }))} />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Bounce rate</h3>
            {data.behavior.bounce.total === 0 ? <p className="mt-4 text-sm text-muted">No visits recorded yet.</p> : (
              <>
                <p className="mt-3 font-display text-4xl font-semibold tabular-nums">{percentOf(data.behavior.bounce.single, data.behavior.bounce.total)}%</p>
                <p className="mt-2 text-sm text-muted">{data.behavior.bounce.single} of {plural(data.behavior.bounce.total, "visitor")} looked at one page and left.</p>
              </>
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold">New and returning</h3>
            <BarList unit="visitors" emptyText="No visits recorded yet." items={[{ label: "New browsers", value: data.behavior.audience.newVisitors }, { label: "Returning browsers", value: data.behavior.audience.returningVisitors }].filter((item) => item.value > 0)} />
            <p className="mt-3 text-xs text-muted">Returning means that browser has visited before. It cannot tell you who someone is, and a different device or cleared browser data counts as new.</p>
          </div>
        </div>
      </section>

      <div className="grid gap-14 lg:grid-cols-2">
        <section aria-labelledby="pages-title">
          <h2 id="pages-title" className="font-display text-2xl font-semibold">Top pages</h2>
          <BarList unit="views" emptyText="No visits recorded yet." items={data.topPages.map((page) => ({ label: pageLabel(page.path), value: page.views, detail: plural(page.visitors, "visitor") }))} />
        </section>
        <section aria-labelledby="sources-title">
          <h2 id="sources-title" className="font-display text-2xl font-semibold">Where visitors come from</h2>
          <BarList unit="visits" emptyText="No visits recorded yet." items={groupSources(data.sources).map((source) => ({ label: source.label, value: source.visits }))} />
        </section>
      </div>

      <section aria-labelledby="campaigns-title">
        <h2 id="campaigns-title" className="font-display text-2xl font-semibold">Campaign links</h2>
        <p className="mt-2 text-sm text-muted">Add <code>?ref=name</code> to any link you share, for example <code>?ref=resume-june</code> on your resume or <code>?ref=linkedin-post</code> on a post. Each name gets its own row here.</p>
        {data.campaigns.length === 0 ? <p className="mt-4 text-sm text-muted">No tagged links have been visited in this period yet.</p> : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[32rem] text-left text-sm">
              <thead className="border-b border-ink/20 text-xs uppercase tracking-[0.12em] text-muted">
                <tr><th scope="col" className="py-2 pr-4">Link name</th><th scope="col" className="py-2 pr-4 text-right">Visits</th><th scope="col" className="py-2 pr-4 text-right">Visitors</th><th scope="col" className="py-2 pr-4 text-right">Opened a project</th><th scope="col" className="py-2 text-right">Reached out</th></tr>
              </thead>
              <tbody className="divide-y divide-ink/10">
                {data.campaigns.map((campaign) => (
                  <tr key={campaign.tag}>
                    <th scope="row" className="py-3 pr-4 font-medium">{campaign.tag}</th>
                    <td className="py-3 pr-4 text-right tabular-nums">{campaign.visits}</td>
                    <td className="py-3 pr-4 text-right tabular-nums">{campaign.visitors}</td>
                    <td className="py-3 pr-4 text-right tabular-nums">{campaign.viewedProject}</td>
                    <td className="py-3 text-right tabular-nums">{campaign.reachedOut}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section aria-labelledby="audience-title">
        <h2 id="audience-title" className="font-display text-2xl font-semibold">Audience</h2>
        <div className="mt-2 grid gap-x-14 gap-y-10 md:grid-cols-2">
          <div>
            <h3 className="text-lg font-semibold">Countries</h3>
            <BarList unit="visitors" emptyText="No location data yet. It appears once the site is live on Vercel." items={data.countries.map((row) => ({ label: countryName(row.country), value: row.visitors, detail: plural(row.views, "view") }))} />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Cities</h3>
            <BarList unit="visitors" emptyText="No location data yet." items={data.cities.map((row) => ({ label: `${row.city}, ${countryName(row.country)}`, value: row.visitors, detail: plural(row.views, "view") }))} />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Devices</h3>
            <BarList unit="views" emptyText="No visits recorded yet." items={data.devices.map((row) => ({ label: row.label.charAt(0).toUpperCase() + row.label.slice(1), value: row.views }))} />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Browsers</h3>
            <BarList unit="views" emptyText="No visits recorded yet." items={data.browsers.map((row) => ({ label: row.label.charAt(0).toUpperCase() + row.label.slice(1), value: row.views }))} />
          </div>
        </div>
      </section>

      <section aria-labelledby="blog-title">
        <h2 id="blog-title" className="font-display text-2xl font-semibold">Blog performance</h2>
        {posts.length === 0 ? <p className="mt-4 text-sm text-muted">No blog posts yet.</p> : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[42rem] text-left text-sm">
              <thead className="border-b border-ink/20 text-xs uppercase tracking-[0.12em] text-muted">
                <tr><th scope="col" className="py-2 pr-4">Post</th><th scope="col" className="py-2 pr-4 text-right">Views</th><th scope="col" className="py-2 pr-4 text-right">Readers</th><th scope="col" className="py-2 pr-4 text-right">Avg. reading time</th><th scope="col" className="py-2 pr-4 text-right">Avg. scroll depth</th><th scope="col" className="py-2 text-right">Trend</th></tr>
              </thead>
              <tbody className="divide-y divide-ink/10">
                {posts.map((post) => {
                  const change = percentChange(post.views, post.previous);
                  return (
                    <tr key={post.slug}>
                      <th scope="row" className="py-3 pr-4 font-medium"><Link href={`/blog/${post.slug}`} className="hover:text-accent">{post.title}</Link></th>
                      <td className="py-3 pr-4 text-right tabular-nums">{post.views}</td>
                      <td className="py-3 pr-4 text-right tabular-nums">{post.visitors}</td>
                      <td className="py-3 pr-4 text-right tabular-nums">{post.reading ? formatDuration(post.reading.avgSeconds) : "-"}</td>
                      <td className="py-3 pr-4 text-right tabular-nums">{post.reading ? `${post.reading.avgScroll}%` : "-"}</td>
                      <td className="py-3 text-right tabular-nums text-muted">{change === null ? "New" : change === 0 ? "-" : `${change > 0 ? "▲" : "▼"} ${Math.abs(change)}%`}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-3 text-xs text-muted">Reading time counts only while the tab is visible, up to the moment the reader first leaves it. Scroll depth is how far down the post readers got, on average.</p>
      </section>

      <section aria-labelledby="contact-title">
        <h2 id="contact-title" className="font-display text-2xl font-semibold">Outreach</h2>
        <p className="mt-2 text-sm text-muted">
          {summary.messages} {summary.messages === 1 ? "message" : "messages"} and {totalContactClicks} contact-link {totalContactClicks === 1 ? "click" : "clicks"} in the last {days} days
          {summary.unreadMessages > 0 ? ` · ${summary.unreadMessages} unread` : ""}. A click means someone tapped a contact link; it does not prove they sent anything.
        </p>
        <BarList unit="clicks" emptyText="No contact-link clicks yet." items={data.contactClicks.map((row) => ({ label: contactLabels[row.target] ?? row.target, value: row.clicks, detail: plural(row.visitors, "visitor") }))} />
        <h3 className="mt-10 text-lg font-semibold">Messages</h3>
        <MessageInbox initialMessages={data.messages} />
      </section>

      <section aria-labelledby="errors-title">
        <h2 id="errors-title" className="font-display text-2xl font-semibold">Errors</h2>
        <p className="mt-2 text-sm text-muted">Problems visitors hit on the site, from both the server and their browsers. Identical errors are grouped.</p>
        {data.errors.total === 0 ? <p className="mt-4 text-sm text-muted">No errors recorded in the last {days} days.</p> : (
          <>
            <p className="mt-4 text-sm font-semibold text-red-700">{plural(data.errors.total, "error")} in the last {days} days</p>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[32rem] text-left text-sm">
                <thead className="border-b border-ink/20 text-xs uppercase tracking-[0.12em] text-muted">
                  <tr><th scope="col" className="py-2 pr-4">Error</th><th scope="col" className="py-2 pr-4">Where</th><th scope="col" className="py-2 pr-4 text-right">Times</th><th scope="col" className="py-2 text-right">Last seen</th></tr>
                </thead>
                <tbody className="divide-y divide-ink/10">
                  {data.errors.groups.map((group) => (
                    <tr key={`${group.source}-${group.message}`}>
                      <th scope="row" className="py-3 pr-4 font-medium">{group.message}</th>
                      <td className="py-3 pr-4 text-muted">{group.source}{group.path ? ` · ${group.path}` : ""}</td>
                      <td className="py-3 pr-4 text-right tabular-nums">{group.count}</td>
                      <td className="py-3 text-right text-muted"><time dateTime={group.lastSeen}>{timeAgo(group.lastSeen, now)}</time></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      <section aria-labelledby="recent-title">
        <h2 id="recent-title" className="font-display text-2xl font-semibold">Recent activity</h2>
        <ActivityFeed items={data.recent} now={now} />
      </section>
    </div>
  );
}
