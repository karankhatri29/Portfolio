import { NextResponse } from "next/server";

import { neon } from "@neondatabase/serverless";

export const dynamic = "force-dynamic";

// Point an uptime monitor at this URL. It reports only ok/down, never internal details.
export async function GET() {
  const headers = { "cache-control": "no-store" };

  try {
    if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not configured");
    await neon(process.env.DATABASE_URL)`SELECT 1`;
    return NextResponse.json({ status: "ok", database: "ok", time: new Date().toISOString() }, { headers });
  } catch {
    return NextResponse.json({ status: "degraded", database: "down", time: new Date().toISOString() }, { status: 503, headers });
  }
}
