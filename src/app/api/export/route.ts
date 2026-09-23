import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { EVENT_EXPORT_COLUMNS, MESSAGE_EXPORT_COLUMNS, exportEvents, exportMessages } from "@/lib/analytics/repository";
import { toCsv } from "@/lib/analytics/csv";

const MAX_DAYS = 365;

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    if (session.role !== "Admin") return NextResponse.json({ error: "Admin access required" }, { status: 403 });

    const params = new URL(request.url).searchParams;
    const type = params.get("type");
    if (type !== "events" && type !== "messages") {
      return NextResponse.json({ errors: ["type must be events or messages"] }, { status: 400 });
    }

    const requestedDays = Number(params.get("days") ?? 90);
    const days = Number.isInteger(requestedDays) && requestedDays >= 1 ? Math.min(requestedDays, MAX_DAYS) : 90;

    const csv = type === "events" ? toCsv(EVENT_EXPORT_COLUMNS, await exportEvents(days)) : toCsv(MESSAGE_EXPORT_COLUMNS, await exportMessages());
    const stamp = new Date().toISOString().slice(0, 10);

    return new Response(csv, {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="portfolio-${type}-${stamp}.csv"`,
        "cache-control": "no-store",
      },
    });
  } catch (error) {
    console.error("export route failed", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
