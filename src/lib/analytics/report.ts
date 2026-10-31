import { cleanErrorReport } from "@/lib/analytics/errors";
import type { ErrorReport } from "@/lib/analytics/errors";
import { countRecentServerErrorGroups, recordError } from "@/lib/analytics/repository";
import { sendEmail } from "@/lib/notify/email";
import { absoluteUrl } from "@/lib/site";

// Shares Resend's free daily quota with contact notifications, so an incident must not be able to use it all up.
const MAX_ALERTED_ERRORS_PER_HOUR = 3;

/**
 * Stores an error and, for the first server error of its kind in 24 hours, emails the owner.
 * Client reports never alert: that endpoint is public, so anyone could trigger the emails.
 */
export async function recordAndAlert(report: ErrorReport): Promise<void> {
  const firstSeen = await recordError(report);
  if (!firstSeen || report.source !== "server") return;
  if ((await countRecentServerErrorGroups(60)) > MAX_ALERTED_ERRORS_PER_HOUR) return;

  await sendEmail({
    subject: `Portfolio error: ${report.message}`,
    text: [`A new server error appeared on your portfolio.`, "", `Message: ${report.message}`, `Page: ${report.path || "unknown"}`, "", `Details: ${absoluteUrl("/admin/analytics")}`].join("\n"),
  });
}

/** Records an error the page chose to survive, so it still shows up under Errors in the admin dashboard. */
export async function reportServerError(error: unknown, path: string): Promise<void> {
  try {
    const report = cleanErrorReport({ message: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : "", path }, "server");
    if (!report || !process.env.DATABASE_URL) return;
    await recordAndAlert(report);
  } catch {
    // Monitoring must never cause or mask a request error.
  }
}

/** Lets a page render without an optional list when its query fails, while still recording the failure. */
export function withReportedFallback<T>(query: Promise<T[]>, path: string): Promise<T[]> {
  return query.catch(async (error: unknown) => {
    console.error("content read failed", path, error instanceof Error ? error.message : error);
    await reportServerError(error, path);
    return [] as T[];
  });
}
