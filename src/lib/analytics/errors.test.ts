import { cleanErrorReport, shouldIgnoreError } from "@/lib/analytics/errors";

describe("shouldIgnoreError", () => {
  it("ignores framework control flow and known browser noise", () => {
    expect(shouldIgnoreError("anything", "NEXT_HTTP_ERROR_FALLBACK;404")).toBe(true);
    expect(shouldIgnoreError("ResizeObserver loop completed with undelivered notifications.", "")).toBe(true);
    expect(shouldIgnoreError("Script error.", "")).toBe(true);
    expect(shouldIgnoreError("The operation was aborted.", "")).toBe(true);
    expect(shouldIgnoreError("Error invoking postMessage: Java object is gone", "")).toBe(true);
    expect(shouldIgnoreError("The destination stream closed early.", "")).toBe(true);
  });

  it("keeps real errors", () => {
    expect(shouldIgnoreError("Cannot read properties of undefined", "abc123")).toBe(false);
  });
});

describe("cleanErrorReport", () => {
  it("trims, caps lengths and strips query strings from the path", () => {
    const report = cleanErrorReport({ message: `  ${"x".repeat(500)}  `, stack: "s".repeat(5000), path: "/blog/a?token=secret#h", digest: "d1" }, "client");

    expect(report?.message).toHaveLength(300);
    expect(report?.stack).toHaveLength(2000);
    expect(report?.path).toBe("/blog/a");
    expect(report).toMatchObject({ source: "client", digest: "d1" });
  });

  it("rejects empty, ignorable and non-object input, and blanks unsafe paths", () => {
    expect(cleanErrorReport({ message: "  " }, "client")).toBeNull();
    expect(cleanErrorReport({ message: "boom", digest: "NEXT_REDIRECT" }, "server")).toBeNull();
    expect(cleanErrorReport(null, "client")).toBeNull();
    expect(cleanErrorReport({ message: "boom", path: "//evil.com" }, "client")?.path).toBe("");
    expect(cleanErrorReport({ message: "boom", path: "https://evil.com" }, "client")?.path).toBe("");
  });
});
