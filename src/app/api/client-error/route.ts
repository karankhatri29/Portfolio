import { cleanErrorReport } from "@/lib/analytics/errors";
import { countRecentErrors, recordError } from "@/lib/analytics/repository";
import { isBot, isSameOrigin } from "@/lib/analytics/tracking";

const MAX_ERRORS_PER_MINUTE = 30;
const skipped = () => new Response(null, { status: 204 });

export async function POST(request: Request) {
  try {
    if (process.env.NODE_ENV === "development" && process.env.ANALYTICS_IN_DEV !== "true") return skipped();
    if (isBot(request.headers.get("user-agent")) || !isSameOrigin(request)) return skipped();

    const report = cleanErrorReport(await request.json().catch(() => null), "client");
    if (!report) return skipped();

    // A crash loop must not be able to flood the database.
    if ((await countRecentErrors(1)) >= MAX_ERRORS_PER_MINUTE) return skipped();

    await recordError(report);
  } catch (error) {
    console.error("client-error route failed", error);
  }

  return skipped();
}
