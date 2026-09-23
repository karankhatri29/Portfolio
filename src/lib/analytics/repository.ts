import { neon } from "@neondatabase/serverless";

export type EventInput = {
  type: "pageview" | "click";
  path: string;
  referrer: string;
  refTag: string;
  isEntry: boolean;
  country: string;
  city: string;
  device: string;
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

export type DashboardData = {
  days: number;
  summary: Summary;
  daily: DailyPoint[];
  topPages: PageStat[];
  blog: BlogStat[];
  sources: SourceStat[];
  contactClicks: ContactClickStat[];
  messages: ContactMessage[];
};

function sqlClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not configured");
  return neon(connectionString);
}

export async function recordEvent(event: EventInput): Promise<void> {
  const sql = sqlClient();
  await sql`
    INSERT INTO events (type, path, referrer, ref_tag, is_entry, country, city, device, visitor_hash, target)
    VALUES (${event.type}, ${event.path}, ${event.referrer}, ${event.refTag}, ${event.isEntry}, ${event.country}, ${event.city}, ${event.device}, ${event.visitorHash}, ${event.target})
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

export async function getDashboardData(days: number): Promise<DashboardData> {
  const [summary, daily, topPages, blog, sources, contactClicks, messages] = await Promise.all([
    getSummary(days),
    getDaily(days),
    getTopPages(days),
    getBlogStats(days),
    getSources(days),
    getContactClicks(days),
    listMessages(),
  ]);

  return { days, summary, daily, topPages, blog, sources, contactClicks, messages };
}
