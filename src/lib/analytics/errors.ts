export type ErrorReport = { source: "client" | "server"; message: string; stack: string; path: string; digest: string };

const IGNORED_MESSAGES = [/ResizeObserver loop/i, /^Script error\.?$/i, /AbortError/i, /operation was aborted/i, /Java object is gone/i, /destination stream closed early/i];

function clip(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

// Framework control-flow errors (notFound, redirect) carry a NEXT_ digest and are not bugs.
export function shouldIgnoreError(message: string, digest: string): boolean {
  return digest.startsWith("NEXT_") || IGNORED_MESSAGES.some((pattern) => pattern.test(message));
}

export function cleanErrorReport(input: unknown, source: ErrorReport["source"]): ErrorReport | null {
  const record = typeof input === "object" && input !== null ? (input as Record<string, unknown>) : {};
  const message = clip(record.message, 300);
  const digest = clip(record.digest, 64);
  if (!message || shouldIgnoreError(message, digest)) return null;

  const rawPath = clip(record.path, 300);
  const path = rawPath.startsWith("/") && !rawPath.startsWith("//") ? rawPath.split(/[?#]/)[0].slice(0, 200) : "";

  return { source, message, stack: clip(record.stack, 2000), path, digest };
}
