import type { Metadata } from "next";

import { auth } from "@/auth";
import { AdminGate } from "@/components/AdminGate";
import { AdminShell } from "@/components/AdminShell";
import { Dashboard, RANGES } from "@/components/analytics/Dashboard";
import { countHealEvents, getDashboardData } from "@/lib/analytics/repository";
import { listBlogPosts } from "@/lib/content/blog";

const DEFAULT_RANGE = 30;


function readDays(value: string | undefined) {
  const days = Number(value);
  return RANGES.includes(days) ? days : DEFAULT_RANGE;
}


export const metadata: Metadata = { title: "Analytics", robots: { index: false, follow: false } };

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const session = await auth();
  const days = readDays((await searchParams).days);
  const isAdmin = session?.role === "Admin";
  const [data, posts, healed] = isAdmin ? await Promise.all([getDashboardData(days), listBlogPosts().catch(() => []), countHealEvents(days).catch(() => [])]) : [null, [], []];

  return (
    <AdminShell current="analytics" title="Analytics" description="Who visits, where they come from, and what they do." signedIn={isAdmin} wide>
      <AdminGate session={session}>{data ? <Dashboard data={data} posts={posts} healed={healed} days={days} now={new Date()} /> : null}</AdminGate>
    </AdminShell>
  );
}
