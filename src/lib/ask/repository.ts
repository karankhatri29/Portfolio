import { neon } from "@neondatabase/serverless";

function sqlClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not configured");
  return neon(connectionString);
}

/** How many questions this visitor asked in the last hour. */
export async function countRecentAsks(visitorHash: string, minutes = 60): Promise<number> {
  const sql = sqlClient();
  const rows = (await sql`SELECT COUNT(*)::int AS count FROM ask_requests WHERE visitor_hash = ${visitorHash} AND created_at > now() - make_interval(mins => ${minutes})`) as { count: number }[];
  return rows[0]?.count ?? 0;
}

/** How many questions everyone asked in the last 24 hours. */
export async function countAsksToday(): Promise<number> {
  const sql = sqlClient();
  const rows = (await sql`SELECT COUNT(*)::int AS count FROM ask_requests WHERE created_at > now() - interval '24 hours'`) as { count: number }[];
  return rows[0]?.count ?? 0;
}

/** Records a request for rate limiting. The question text is stored only when `question` is provided. */
export async function recordAsk(visitorHash: string, question = ""): Promise<void> {
  const sql = sqlClient();
  await sql`INSERT INTO ask_requests (visitor_hash, question) VALUES (${visitorHash}, ${question})`;
}

/** Keeps the table tiny: nothing older than three days is needed for the limits. */
export async function pruneOldAsks(): Promise<void> {
  const sql = sqlClient();
  await sql`DELETE FROM ask_requests WHERE created_at < now() - interval '3 days'`;
}
