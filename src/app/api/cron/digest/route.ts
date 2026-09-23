import { timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";

import { getDashboardData } from "@/lib/analytics/repository";
import { listBlogPosts } from "@/lib/content/blog";
import { buildDigest } from "@/lib/notify/digest";
import { emailConfig, sendEmail } from "@/lib/notify/email";

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const provided = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return provided.length === expected.length && timingSafeEqual(provided, expected);
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!emailConfig()) return NextResponse.json({ sent: false, reason: "Email is not configured" });

  try {
    const data = await getDashboardData(7);
    const titles = Object.fromEntries(listBlogPosts().map((post) => [`/blog/${post.slug}`, post.title]));
    const digest = buildDigest(data, new URL(request.url).origin, titles);

    return NextResponse.json({ sent: (await sendEmail(digest)) === "sent" });
  } catch (error) {
    console.error("digest route failed", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
