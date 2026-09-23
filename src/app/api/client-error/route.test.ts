/**
 * @jest-environment node
 */
import { countRecentErrors, recordError } from "@/lib/analytics/repository";

import { POST } from "./route";

jest.mock("@/lib/analytics/repository", () => ({ countRecentErrors: jest.fn(), recordError: jest.fn() }));

const mockCount = jest.mocked(countRecentErrors);
const mockRecord = jest.mocked(recordError);
const browser = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36";

function report(body: unknown, headers: Record<string, string> = {}) {
  return POST(new Request("http://localhost/api/client-error", { method: "POST", headers: { host: "localhost", "user-agent": browser, ...headers }, body: JSON.stringify(body) }));
}

beforeEach(() => mockCount.mockResolvedValue(0));

describe("/api/client-error", () => {
  it("stores a cleaned client error", async () => {
    const response = await report({ message: "Boom", stack: "at x", path: "/blog/a?secret=1", digest: "d" });

    expect(response.status).toBe(204);
    expect(mockRecord).toHaveBeenCalledWith({ source: "client", message: "Boom", stack: "at x", path: "/blog/a", digest: "d" });
  });

  it.each([
    ["a bot", { message: "Boom" }, { "user-agent": "Googlebot/2.1" }],
    ["a cross-origin post", { message: "Boom" }, { origin: "https://evil.example" }],
    ["an empty message", { message: "" }, {}],
    ["framework control flow", { message: "NEXT_NOT_FOUND", digest: "NEXT_HTTP_ERROR_FALLBACK;404" }, {}],
  ])("ignores %s", async (_label, body, headers) => {
    expect((await report(body, headers as Record<string, string>)).status).toBe(204);
    expect(mockRecord).not.toHaveBeenCalled();
  });

  it("stops recording during an error flood and survives storage failures", async () => {
    mockCount.mockResolvedValue(30);
    await report({ message: "Boom" });
    expect(mockRecord).not.toHaveBeenCalled();

    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
    mockCount.mockResolvedValue(0);
    mockRecord.mockRejectedValue(new Error("db down"));
    expect((await report({ message: "Boom" })).status).toBe(204);
    consoleError.mockRestore();
  });
});
