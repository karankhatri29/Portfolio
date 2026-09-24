import { cleanErrorReport } from "@/lib/analytics/errors";
import { recordError } from "@/lib/analytics/repository";

/** Records an error the page chose to survive, so it still shows up under Errors in the admin dashboard. */
export async function reportServerError(error: unknown, path: string): Promise<void> {
  try {
    const report = cleanErrorReport({ message: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : "", path }, "server");
    if (!report || !process.env.DATABASE_URL) return;
    await recordError(report);
  } catch {
    // Monitoring must never cause or mask a request error.
  }
}
