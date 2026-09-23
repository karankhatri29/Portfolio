export function reportClientError(error: unknown, digest?: string) {
  try {
    const body = JSON.stringify({
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : "",
      path: window.location.pathname,
      digest: digest ?? (typeof error === "object" && error !== null && "digest" in error ? String((error as { digest: unknown }).digest) : ""),
    });

    if (navigator.sendBeacon?.("/api/client-error", body)) return;
    void fetch("/api/client-error", { method: "POST", body, keepalive: true });
  } catch {
    // Reporting must never throw from inside an error handler.
  }
}
