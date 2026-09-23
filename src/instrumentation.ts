import type { Instrumentation } from "next";

export const onRequestError: Instrumentation.onRequestError = async (error, request) => {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  try {
    const { cleanErrorReport } = await import("@/lib/analytics/errors");
    const digest = typeof error === "object" && error !== null && "digest" in error ? String((error as { digest: unknown }).digest) : "";
    const report = cleanErrorReport(
      { message: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : "", path: request.path, digest },
      "server",
    );
    if (!report) return;

    console.error("server error", report.path, report.message);
    if (!process.env.DATABASE_URL) return;

    const { recordError } = await import("@/lib/analytics/repository");
    await recordError(report);
  } catch {
    // Monitoring must never cause or mask a request error.
  }
};
