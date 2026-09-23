import { neon } from "@neondatabase/serverless";

export type EventInput = {
  type: "pageview" | "click" | "engagement";
  path: string;
  referrer: string;
  refTag: string;
  isEntry: boolean;
  isReturning: boolean;
  country: string;
  city: string;
  device: string;
  browser: string;
  durationSeconds: number;
  scrollPercent: number;
  visitorHash: string;
  target: string;
};

export type MessageStatus = "new" | "replied" | "archived";
export const MESSAGE_STATUSES: MessageStatus[] = ["new", "replied", "archived"];

export type ContactMessage = { id: string; createdAt: string; name: string; email: string; message: string; status: MessageStatus };

export type Summary = {
  views: number;
  visitors: number;
  contactClicks: number;
  messages: number;
  previous: { views: number; visitors: number; contactClicks: number; messages: number };
  unreadMessages: number;
};

export type DailyPoint = { day: string; views: number; visitors: number };
export type PageStat = { path: string; views: number; visitors: number };
export type BlogStat = PageStat & { previousViews: number };
export type SourceStat = { source: string; visits: number; visitors: number };
export type ContactClickStat = { target: string; clicks: number; visitors: number };
export type BreakdownStat = { label: string; views: number };
export type Funnel = { visitors: number; viewedProject: number; reachedOut: number };
export type CampaignStat = { tag: string; visits: number; visitors: number; viewedProject: number; reachedOut: number };
export type CountryStat = { country: string; views: number; visitors: number };
export type CityStat = { city: string; country: string; views: number; visitors: number };
export type EngagementStat = { path: string; avgSeconds: number; avgScroll: number; samples: number };
export type EntryExitStat = { path: string; count: number };
export type Behavior = {
  entryPages: EntryExitStat[];
  exitPages: EntryExitStat[];
  bounce: { total: number; single: number };
  audience: { newVisitors: number; returningVisitors: number };
};
export type ErrorGroup = { message: string; source: string; count: number; lastSeen: string; path: string };
export type ErrorSummary = { total: number; groups: ErrorGroup[] };
export type RecentActivity = { at: string; kind: "pageview" | "click" | "message"; path: string; country: string; city: string; device: string; detail: string };

export type DashboardData = {
  days: number;
  summary: Summary;
  daily: DailyPoint[];
  topPages: PageStat[];
  blog: BlogStat[];
  sources: SourceStat[];
  contactClicks: ContactClickStat[];
  messages: ContactMessage[];
  funnel: Funnel;
  campaigns: CampaignStat[];
  countries: CountryStat[];
  cities: CityStat[];
  devices: BreakdownStat[];
  browsers: BreakdownStat[];
  engagement: EngagementStat[];
  recent: RecentActivity[];
  behavior: Behavior;
  errors: ErrorSummary;
};

function sqlClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not configured");
  return neon(connectionString);
}

export async function recordEvent(event: EventInput): Promise<void> {
  const sql = sqlClient();
  await sql`
    INSERT INTO events (type, path, referrer, ref_tag, is_entry, is_returning, country, city, device, browser, duration_s, scroll_pct, visitor_hash, target)
    VALUES (${event.type}, ${event.path}, ${event.referrer}, ${event.refTag}, ${event.isEntry}, ${event.isReturning}, ${event.country}, ${event.city}, ${event.device}, ${event.browser}, ${event.durationSeconds}, ${event.scrollPercent}, ${event.visitorHash}, ${event.target})
  `;
}

export async function createMessage(input: { name: string; email: string; message: string; senderHash: string }): Promise<string> {
  const sql = sqlClient();
  const id = crypto.randomUUID();
  await sql`
    INSERT INTO contact_messages (id, name, email, message, sender_hash)
    VALUES (${id}, ${input.name}, ${input.email}, ${input.message}, ${input.senderHash})
  `;
  return id;
}

export async function countRecentMessages(senderHash: string, minutes: number): Promise<number> {
  const sql = sqlClient();
  const rows = (await sql`
    SELECT COUNT(*)::int AS count FROM contact_messages
    WHERE sender_hash = ${senderHash} AND created_at >= now() - make_interval(mins => ${minutes}::int)
  `) as { count: number }[];
  return rows[0]?.count ?? 0;
}

export async function setMessageStatus(id: string, status: MessageStatus): Promise<boolean> {
  const sql = sqlClient();
  const rows = (await sql`UPDATE contact_messages SET status = ${status} WHERE id = ${id} RETURNING id`) as { id: string }[];
  return rows.length > 0;
}

export async function listMessages(limit = 50): Promise<ContactMessage[]> {
  const sql = sqlClient();
  const rows = (await sql`
    SELECT id, to_char(created_at AT TIME ZONE 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS "createdAt", name, email, message, status
    FROM contact_messages ORDER BY created_at DESC LIMIT ${limit}
  `) as ContactMessage[];
  return rows;
}

async function getSummary(days: number): Promise<Summary> {
  const sql = sqlClient();
  const rows = (await sql`
    SELECT
      COUNT(*) FILTER (WHERE type = 'pageview' AND created_at >= now() - make_interval(days => ${days}::int))::int AS views,
      COUNT(DISTINCT visitor_hash) FILTER (WHERE type = 'pageview' AND created_at >= now() - make_interval(days => ${days}::int))::int AS visitors,
      COUNT(*) FILTER (WHERE type = 'click' AND created_at >= now() - make_interval(days => ${days}::int))::int AS "contactClicks",
      COUNT(*) FILTER (WHERE type = 'pageview' AND created_at < now() - make_interval(days => ${days}::int))::int AS "prevViews",
      COUNT(DISTINCT visitor_hash) FILTER (WHERE type = 'pageview' AND created_at < now() - make_interval(days => ${days}::int))::int AS "prevVisitors",
      COUNT(*) FILTER (WHERE type = 'click' AND created_at < now() - make_interval(days => ${days}::int))::int AS "prevClicks"
    FROM events WHERE created_at >= now() - make_interval(days => ${days * 2}::int)
  `) as { views: number; visitors: number; contactClicks: number; prevViews: number; prevVisitors: number; prevClicks: number }[];

  const messageRows = (await sql`
    SELECT
      COUNT(*) FILTER (WHERE created_at >= now() - make_interval(days => ${days}::int))::int AS current,
      COUNT(*) FILTER (WHERE created_at < now() - make_interval(days => ${days}::int))::int AS previous,
      COUNT(*) FILTER (WHERE status = 'new')::int AS unread
    FROM contact_messages
  `) as { current: number; previous: number; unread: number }[];

  const row = rows[0];
  const messages = messageRows[0];
  return {
    views: row.views,
    visitors: row.visitors,
    contactClicks: row.contactClicks,
    messages: messages.current,
    previous: { views: row.prevViews, visitors: row.prevVisitors, contactClicks: row.prevClicks, messages: messages.previous },
    unreadMessages: messages.unread,
  };
}

async function getDaily(days: number): Promise<DailyPoint[]> {
  const sql = sqlClient();
  return (await sql`
    SELECT to_char(d, 'YYYY-MM-DD') AS day, COALESCE(v.views, 0)::int AS views, COALESCE(v.visitors, 0)::int AS visitors
    FROM generate_series(
      (now() AT TIME ZONE 'utc')::date - ${days - 1}::int,
      (now() AT TIME ZONE 'utc')::date,
      interval '1 day'
    ) AS d
    LEFT JOIN (
      SELECT (created_at AT TIME ZONE 'utc')::date AS day, COUNT(*) AS views, COUNT(DISTINCT visitor_hash) AS visitors
      FROM events
      WHERE type = 'pageview' AND created_at >= ((now() AT TIME ZONE 'utc')::date - ${days - 1}::int) AT TIME ZONE 'utc'
      GROUP BY 1
    ) v ON v.day = d::date
    ORDER BY d
  `) as DailyPoint[];
}

async function getTopPages(days: number): Promise<PageStat[]> {
  const sql = sqlClient();
  return (await sql`
    SELECT path, COUNT(*)::int AS views, COUNT(DISTINCT visitor_hash)::int AS visitors
    FROM events
    WHERE type = 'pageview' AND created_at >= now() - make_interval(days => ${days}::int)
    GROUP BY path ORDER BY views DESC, path ASC LIMIT 15
  `) as PageStat[];
}

async function getBlogStats(days: number): Promise<BlogStat[]> {
  const sql = sqlClient();
  return (await sql`
    SELECT path,
      COUNT(*) FILTER (WHERE created_at >= now() - make_interval(days => ${days}::int))::int AS views,
      COUNT(DISTINCT visitor_hash) FILTER (WHERE created_at >= now() - make_interval(days => ${days}::int))::int AS visitors,
      COUNT(*) FILTER (WHERE created_at < now() - make_interval(days => ${days}::int))::int AS "previousViews"
    FROM events
    WHERE type = 'pageview' AND path LIKE '/blog/%' AND created_at >= now() - make_interval(days => ${days * 2}::int)
    GROUP BY path
  `) as BlogStat[];
}

async function getSources(days: number): Promise<SourceStat[]> {
  const sql = sqlClient();
  return (await sql`
    SELECT COALESCE(NULLIF(ref_tag, ''), NULLIF(referrer, ''), 'direct') AS source,
      COUNT(*)::int AS visits, COUNT(DISTINCT visitor_hash)::int AS visitors
    FROM events
    WHERE type = 'pageview' AND is_entry AND created_at >= now() - make_interval(days => ${days}::int)
    GROUP BY 1 ORDER BY visits DESC LIMIT 12
  `) as SourceStat[];
}

async function getContactClicks(days: number): Promise<ContactClickStat[]> {
  const sql = sqlClient();
  return (await sql`
    SELECT target, COUNT(*)::int AS clicks, COUNT(DISTINCT visitor_hash)::int AS visitors
    FROM events
    WHERE type = 'click' AND created_at >= now() - make_interval(days => ${days}::int)
    GROUP BY target ORDER BY clicks DESC
  `) as ContactClickStat[];
}

async function getFunnel(days: number): Promise<Funnel> {
  const sql = sqlClient();
  const rows = (await sql`
    WITH visitors AS (
      SELECT DISTINCT visitor_hash FROM events
      WHERE type = 'pageview' AND created_at >= now() - make_interval(days => ${days}::int)
    ),
    project_viewers AS (
      SELECT DISTINCT visitor_hash FROM events
      WHERE type = 'pageview' AND path LIKE '/projects/%' AND created_at >= now() - make_interval(days => ${days}::int)
    ),
    contacted AS (
      SELECT visitor_hash FROM events WHERE type = 'click' AND created_at >= now() - make_interval(days => ${days}::int)
      UNION
      SELECT sender_hash FROM contact_messages WHERE created_at >= now() - make_interval(days => ${days}::int)
    )
    SELECT
      (SELECT COUNT(*) FROM visitors)::int AS visitors,
      (SELECT COUNT(*) FROM project_viewers)::int AS "viewedProject",
      (SELECT COUNT(*) FROM contacted)::int AS "reachedOut"
  `) as Funnel[];
  return rows[0];
}

async function getCampaigns(days: number): Promise<CampaignStat[]> {
  const sql = sqlClient();
  return (await sql`
    SELECT e.ref_tag AS tag, COUNT(*)::int AS visits, COUNT(DISTINCT e.visitor_hash)::int AS visitors,
      COUNT(DISTINCT e.visitor_hash) FILTER (WHERE EXISTS (
        SELECT 1 FROM events x WHERE x.visitor_hash = e.visitor_hash AND x.type = 'pageview' AND x.path LIKE '/projects/%'
          AND x.created_at >= now() - make_interval(days => ${days}::int)
      ))::int AS "viewedProject",
      COUNT(DISTINCT e.visitor_hash) FILTER (WHERE EXISTS (
        SELECT 1 FROM events x WHERE x.visitor_hash = e.visitor_hash AND x.type = 'click'
          AND x.created_at >= now() - make_interval(days => ${days}::int)
      ) OR EXISTS (
        SELECT 1 FROM contact_messages m WHERE m.sender_hash = e.visitor_hash
          AND m.created_at >= now() - make_interval(days => ${days}::int)
      ))::int AS "reachedOut"
    FROM events e
    WHERE e.type = 'pageview' AND e.is_entry AND e.ref_tag <> '' AND e.created_at >= now() - make_interval(days => ${days}::int)
    GROUP BY e.ref_tag ORDER BY visits DESC, tag ASC LIMIT 10
  `) as CampaignStat[];
}

async function getCountries(days: number): Promise<CountryStat[]> {
  const sql = sqlClient();
  return (await sql`
    SELECT country, COUNT(*)::int AS views, COUNT(DISTINCT visitor_hash)::int AS visitors
    FROM events
    WHERE type = 'pageview' AND country <> '' AND created_at >= now() - make_interval(days => ${days}::int)
    GROUP BY country ORDER BY visitors DESC, views DESC LIMIT 10
  `) as CountryStat[];
}

async function getCities(days: number): Promise<CityStat[]> {
  const sql = sqlClient();
  return (await sql`
    SELECT city, country, COUNT(*)::int AS views, COUNT(DISTINCT visitor_hash)::int AS visitors
    FROM events
    WHERE type = 'pageview' AND city <> '' AND created_at >= now() - make_interval(days => ${days}::int)
    GROUP BY city, country ORDER BY visitors DESC, views DESC LIMIT 10
  `) as CityStat[];
}

async function getBreakdown(days: number, column: "device" | "browser"): Promise<BreakdownStat[]> {
  const sql = sqlClient();
  const rows = column === "device"
    ? await sql`
        SELECT COALESCE(NULLIF(device, ''), 'unknown') AS label, COUNT(*)::int AS views FROM events
        WHERE type = 'pageview' AND created_at >= now() - make_interval(days => ${days}::int) GROUP BY 1 ORDER BY views DESC`
    : await sql`
        SELECT COALESCE(NULLIF(browser, ''), 'unknown') AS label, COUNT(*)::int AS views FROM events
        WHERE type = 'pageview' AND created_at >= now() - make_interval(days => ${days}::int) GROUP BY 1 ORDER BY views DESC`;
  return rows as BreakdownStat[];
}

async function getEngagement(days: number): Promise<EngagementStat[]> {
  const sql = sqlClient();
  return (await sql`
    SELECT path, ROUND(AVG(duration_s))::int AS "avgSeconds", ROUND(AVG(scroll_pct))::int AS "avgScroll", COUNT(*)::int AS samples
    FROM events
    WHERE type = 'engagement' AND duration_s > 0 AND created_at >= now() - make_interval(days => ${days}::int)
    GROUP BY path
  `) as EngagementStat[];
}

async function getRecent(): Promise<RecentActivity[]> {
  const sql = sqlClient();
  return (await sql`
    SELECT to_char(activity.at AT TIME ZONE 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS at, activity.kind, activity.path, activity.country, activity.city, activity.device, activity.detail
    FROM (
      SELECT created_at AS at, type AS kind, path, country, city, device, target AS detail FROM events WHERE type IN ('pageview', 'click')
      UNION ALL
      SELECT created_at, 'message', '', '', '', '', name FROM contact_messages
    ) activity
    ORDER BY activity.at DESC LIMIT 20
  `) as RecentActivity[];
}

async function getBehavior(days: number): Promise<Behavior> {
  const sql = sqlClient();
  const entryPages = (await sql`
    SELECT path, COUNT(*)::int AS count FROM events
    WHERE type = 'pageview' AND is_entry AND created_at >= now() - make_interval(days => ${days}::int)
    GROUP BY path ORDER BY count DESC, path ASC LIMIT 8
  `) as EntryExitStat[];

  const exitPages = (await sql`
    SELECT path, COUNT(*)::int AS count FROM (
      SELECT DISTINCT ON (visitor_hash) path FROM events
      WHERE type = 'pageview' AND created_at >= now() - make_interval(days => ${days}::int)
      ORDER BY visitor_hash, created_at DESC
    ) last_pages
    GROUP BY path ORDER BY count DESC, path ASC LIMIT 8
  `) as EntryExitStat[];

  const bounce = (await sql`
    SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE views = 1)::int AS single FROM (
      SELECT visitor_hash, COUNT(*) AS views FROM events
      WHERE type = 'pageview' AND created_at >= now() - make_interval(days => ${days}::int)
      GROUP BY visitor_hash
    ) per_visitor
  `) as { total: number; single: number }[];

  const audience = (await sql`
    SELECT COUNT(DISTINCT visitor_hash) FILTER (WHERE NOT is_returning)::int AS "newVisitors",
      COUNT(DISTINCT visitor_hash) FILTER (WHERE is_returning)::int AS "returningVisitors"
    FROM events
    WHERE type = 'pageview' AND is_entry AND created_at >= now() - make_interval(days => ${days}::int)
  `) as { newVisitors: number; returningVisitors: number }[];

  return { entryPages, exitPages, bounce: bounce[0], audience: audience[0] };
}

export const EVENT_EXPORT_COLUMNS = ["time_utc", "type", "path", "referrer", "campaign", "is_entry", "returning_browser", "country", "city", "device", "browser", "reading_seconds", "scroll_percent", "contact_target"];
export const MESSAGE_EXPORT_COLUMNS = ["time_utc", "name", "email", "message", "status"];

export async function exportEvents(days: number): Promise<(string | number | boolean)[][]> {
  const sql = sqlClient();
  const rows = (await sql`
    SELECT to_char(created_at AT TIME ZONE 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS time_utc, type, path, referrer, ref_tag, is_entry, is_returning,
      country, city, device, browser, duration_s, scroll_pct, target
    FROM events WHERE created_at >= now() - make_interval(days => ${days}::int)
    ORDER BY created_at DESC LIMIT 50000
  `) as Record<string, string | number | boolean>[];
  return rows.map((row) => ["time_utc", "type", "path", "referrer", "ref_tag", "is_entry", "is_returning", "country", "city", "device", "browser", "duration_s", "scroll_pct", "target"].map((key) => row[key]));
}

export async function exportMessages(): Promise<string[][]> {
  const sql = sqlClient();
  const rows = (await sql`
    SELECT to_char(created_at AT TIME ZONE 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS time_utc, name, email, message, status
    FROM contact_messages ORDER BY created_at DESC LIMIT 5000
  `) as Record<string, string>[];
  return rows.map((row) => [row.time_utc, row.name, row.email, row.message, row.status]);
}

export async function recordError(report: { source: string; message: string; stack: string; path: string; digest: string }): Promise<void> {
  const sql = sqlClient();
  await sql`
    INSERT INTO error_logs (source, message, stack, path, digest)
    VALUES (${report.source}, ${report.message}, ${report.stack}, ${report.path}, ${report.digest})
  `;
}

export async function countRecentErrors(minutes: number): Promise<number> {
  const sql = sqlClient();
  const rows = (await sql`SELECT COUNT(*)::int AS count FROM error_logs WHERE created_at >= now() - make_interval(mins => ${minutes}::int)`) as { count: number }[];
  return rows[0]?.count ?? 0;
}

async function getErrors(days: number): Promise<ErrorSummary> {
  const sql = sqlClient();
  const groups = (await sql`
    SELECT message, source, COUNT(*)::int AS count,
      to_char(MAX(created_at) AT TIME ZONE 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS "lastSeen",
      COALESCE((ARRAY_AGG(path ORDER BY created_at DESC) FILTER (WHERE path <> ''))[1], '') AS path
    FROM error_logs
    WHERE created_at >= now() - make_interval(days => ${days}::int)
    GROUP BY message, source ORDER BY MAX(created_at) DESC LIMIT 10
  `) as ErrorGroup[];
  const totals = (await sql`SELECT COUNT(*)::int AS total FROM error_logs WHERE created_at >= now() - make_interval(days => ${days}::int)`) as { total: number }[];

  return { total: totals[0]?.total ?? 0, groups };
}

export async function getDashboardData(days: number): Promise<DashboardData> {
  const [summary, daily, topPages, blog, sources, contactClicks, messages, funnel, campaigns, countries, cities, devices, browsers, engagement, recent, behavior, errors] = await Promise.all([
    getSummary(days),
    getDaily(days),
    getTopPages(days),
    getBlogStats(days),
    getSources(days),
    getContactClicks(days),
    listMessages(),
    getFunnel(days),
    getCampaigns(days),
    getCountries(days),
    getCities(days),
    getBreakdown(days, "device"),
    getBreakdown(days, "browser"),
    getEngagement(days),
    getRecent(),
    getBehavior(days),
    getErrors(days),
  ]);

  return { days, summary, daily, topPages, blog, sources, contactClicks, messages, funnel, campaigns, countries, cities, devices, browsers, engagement, recent, behavior, errors };
}
