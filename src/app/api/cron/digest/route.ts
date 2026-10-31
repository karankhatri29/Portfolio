import { timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";

import { countHealEvents, getDashboardData, pruneOldAnalytics } from "@/lib/analytics/repository";
import { readLimit } from "@/lib/ask/limits";
import { listBlogPosts } from "@/lib/content/blog";
import { resendPendingNotifications } from "@/lib/notify/contact";
import { buildDigest } from "@/lib/notify/digest";
import { emailConfig, sendEmail } from "@/lib/notify/email";

// The dashboard compares each range with the one before it, so the longest range (90 days) needs 180 days of history.
const MIN_RETENTION_DAYS = 190;
const DEFAULT_RETENTION_DAYS = 365;

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const provided = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return provided.length === expected.length && timingSafeEqual(provided, expected);
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // Housekeeping runs first so it still happens when email is not configured. A failure must not block the digest.
  const retentionDays = Math.max(MIN_RETENTION_DAYS, readLimit(process.env.ANALYTICS_RETENTION_DAYS, DEFAULT_RETENTION_DAYS));
  await pruneOldAnalytics(retentionDays).catch((error) => console.error("analytics prune failed", error));

  const origin = new URL(request.url).origin;
  if (emailConfig()) await resendPendingNotifications(origin, 10);

  if (!emailConfig()) return NextResponse.json({ sent: false, reason: "Email is not configured" });

  try {
    const data = await getDashboardData(7);
    const titles = Object.fromEntries((await listBlogPosts()).map((post) => [`/blog/${post.slug}`, post.title]));
    const healed = await countHealEvents(7).catch(() => []);
    const digest = buildDigest(data, origin, titles, healed);

    return NextResponse.json({ sent: (await sendEmail(digest)) === "sent" });
  } catch (error) {
    console.error("digest route failed", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
