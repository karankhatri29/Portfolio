/**
 * @jest-environment node
 */
import { auth } from "@/auth";
import { recordEvent } from "@/lib/analytics/repository";

import { POST } from "./route";

jest.mock("@/auth", () => ({ auth: jest.fn() }));
jest.mock("@/lib/analytics/repository", () => ({ recordEvent: jest.fn() }));

const mockAuth = auth as unknown as jest.Mock;
const mockRecord = jest.mocked(recordEvent);

const browser = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36";

function track(body: unknown, headers: Record<string, string> = {}) {
  return POST(new Request("http://localhost/api/track", {
    method: "POST",
    headers: { "user-agent": browser, host: "localhost", "x-forwarded-for": "1.2.3.4", "x-vercel-ip-country": "IN", "x-vercel-ip-city": "Pune", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  }));
}

beforeEach(() => {
  mockAuth.mockResolvedValue(null);
});

describe("/api/track", () => {
  it("records an entry pageview with source, geo, device and a hashed visitor id", async () => {
    const response = await track({ type: "pageview", path: "/blog/hello/?x=1", isEntry: true, referrer: "https://www.linkedin.com/feed", ref: "Resume-June" });

    expect(response.status).toBe(204);
    expect(mockRecord).toHaveBeenCalledTimes(1);
    const event = mockRecord.mock.calls[0][0];
    expect(event).toMatchObject({ type: "pageview", path: "/blog/hello", isEntry: true, referrer: "linkedin.com", refTag: "resume-june", country: "IN", city: "Pune", device: "desktop", target: "" });
    expect(event.visitorHash).toMatch(/^[0-9a-f]{32}$/);
    expect(JSON.stringify(event)).not.toContain("1.2.3.4");
  });

  it("drops referrer and campaign data on non-entry pageviews", async () => {
    await track({ type: "pageview", path: "/", isEntry: false, referrer: "https://linkedin.com", ref: "x" });

    expect(mockRecord.mock.calls[0][0]).toMatchObject({ referrer: "", refTag: "", isEntry: false });
  });

  it("records an allowed contact click", async () => {
    await track({ type: "click", path: "/", target: "email" });

    expect(mockRecord.mock.calls[0][0]).toMatchObject({ type: "click", target: "email" });
  });

  it.each([
    ["a bot", { type: "pageview", path: "/" }, { "user-agent": "Googlebot/2.1" }],
    ["Do Not Track", { type: "pageview", path: "/" }, { dnt: "1" }],
    ["a cross-origin request", { type: "pageview", path: "/" }, { origin: "https://evil.example" }],
    ["an admin path", { type: "pageview", path: "/admin/analytics" }, {}],
    ["an unknown type", { type: "purchase", path: "/" }, {}],
    ["an unknown click target", { type: "click", path: "/", target: "fax" }, {}],
    ["malformed JSON", "{not json", {}],
  ])("ignores %s without recording", async (_label, body, headers) => {
    const response = await track(body, headers as Record<string, string>);

    expect(response.status).toBe(204);
    expect(mockRecord).not.toHaveBeenCalled();
  });

  it("skips local development traffic unless ANALYTICS_IN_DEV is enabled", async () => {
    const env = process.env as Record<string, string | undefined>;
    const original = env.NODE_ENV;
    env.NODE_ENV = "development";

    await track({ type: "pageview", path: "/" });
    expect(mockRecord).not.toHaveBeenCalled();

    env.ANALYTICS_IN_DEV = "true";
    await track({ type: "pageview", path: "/" });
    expect(mockRecord).toHaveBeenCalledTimes(1);

    delete env.ANALYTICS_IN_DEV;
    env.NODE_ENV = original;
  });

  it("does not count the signed-in Admin", async () => {
    mockAuth.mockResolvedValue({ role: "Admin", user: { email: "owner@example.com" } });

    await track({ type: "pageview", path: "/" });

    expect(mockRecord).not.toHaveBeenCalled();
  });

  it("still answers 204 when storage fails", async () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
    mockRecord.mockRejectedValue(new Error("db down"));

    const response = await track({ type: "pageview", path: "/" });

    expect(response.status).toBe(204);
    consoleError.mockRestore();
  });
});
