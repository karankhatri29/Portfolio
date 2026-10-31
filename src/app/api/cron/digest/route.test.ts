/**
 * @jest-environment node
 */
import { countHealEvents, getDashboardData, pruneOldAnalytics } from "@/lib/analytics/repository";
import { resendPendingNotifications } from "@/lib/notify/contact";
import { emailConfig, sendEmail } from "@/lib/notify/email";

import { GET } from "./route";

jest.mock("@/lib/analytics/repository", () => ({ getDashboardData: jest.fn(), pruneOldAnalytics: jest.fn(), countHealEvents: jest.fn() }));
jest.mock("@/lib/notify/contact", () => ({ resendPendingNotifications: jest.fn() }));
jest.mock("@/lib/content/blog", () => ({ listBlogPosts: () => [{ slug: "a", title: "Post A" }] }));
jest.mock("@/lib/notify/email", () => ({ emailConfig: jest.fn(), sendEmail: jest.fn() }));

const mockData = jest.mocked(getDashboardData);
const mockPrune = jest.mocked(pruneOldAnalytics);
const mockHealed = jest.mocked(countHealEvents);
const mockResend = jest.mocked(resendPendingNotifications);
const mockConfig = jest.mocked(emailConfig);
const mockSend = jest.mocked(sendEmail);
const env = process.env as Record<string, string | undefined>;
const original = env.CRON_SECRET;

const call = (authorization?: string) => GET(new Request("https://me.example/api/cron/digest", { headers: authorization ? { authorization } : {} }));

beforeEach(() => {
  env.CRON_SECRET = "s3cret";
  mockConfig.mockReturnValue({ apiKey: "k", to: "me@example.com", from: "f" });
  mockSend.mockResolvedValue("sent");
  mockPrune.mockResolvedValue(undefined);
  mockHealed.mockResolvedValue([]);
  mockResend.mockResolvedValue(0);
  mockData.mockResolvedValue({
    days: 7,
    summary: { views: 10, visitors: 5, contactClicks: 1, messages: 0, unreadMessages: 0, previous: { views: 5, visitors: 5, contactClicks: 0, messages: 0 } },
    topPages: [],
    blog: [],
    sources: [],
    errors: { total: 0, groups: [] },
  } as unknown as Awaited<ReturnType<typeof getDashboardData>>);
});

afterAll(() => {
  env.CRON_SECRET = original;
});

describe("/api/cron/digest", () => {
  it("rejects missing or wrong credentials and never queries data", async () => {
    expect((await call()).status).toBe(401);
    expect((await call("Bearer nope")).status).toBe(401);
    expect(mockData).not.toHaveBeenCalled();
  });

  it("fails closed when no CRON_SECRET is configured", async () => {
    delete env.CRON_SECRET;

    expect((await call("Bearer undefined")).status).toBe(401);
    expect((await call("Bearer ")).status).toBe(401);
  });

  it("does nothing when email is not configured", async () => {
    mockConfig.mockReturnValue(null);

    const response = await call("Bearer s3cret");

    expect(await response.json()).toEqual({ sent: false, reason: "Email is not configured" });
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("prunes old analytics even when email is not configured, keeping at least 190 days", async () => {
    mockConfig.mockReturnValue(null);
    await call("Bearer s3cret");
    expect(mockPrune).toHaveBeenLastCalledWith(365);

    env.ANALYTICS_RETENTION_DAYS = "30";
    await call("Bearer s3cret");
    expect(mockPrune).toHaveBeenLastCalledWith(190);

    env.ANALYTICS_RETENTION_DAYS = "500";
    await call("Bearer s3cret");
    expect(mockPrune).toHaveBeenLastCalledWith(500);
    delete env.ANALYTICS_RETENTION_DAYS;
  });

  it("still sends the digest when pruning fails, and never prunes for unauthorised callers", async () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
    mockPrune.mockRejectedValue(new Error("db down"));
    expect(await (await call("Bearer s3cret")).json()).toEqual({ sent: true });
    consoleError.mockRestore();

    mockPrune.mockClear();
    await call("Bearer nope");
    expect(mockPrune).not.toHaveBeenCalled();
  });

  it("re-sends contact notifications that failed earlier, but only when email is configured", async () => {
    await call("Bearer s3cret");
    expect(mockResend).toHaveBeenCalledWith("https://me.example", 10);

    mockResend.mockClear();
    mockConfig.mockReturnValue(null);
    await call("Bearer s3cret");
    expect(mockResend).not.toHaveBeenCalled();
  });

  it("tells the owner how often the site recovered by itself, and still sends if that count fails", async () => {
    mockHealed.mockResolvedValue([{ dependency: "database", action: "retried", count: 4 }, { dependency: "gemini", action: "fallback-model", count: 1 }]);
    await call("Bearer s3cret");
    expect(mockSend.mock.calls[0][0].text).toContain("Recovered automatically: 5 times (database 4, gemini 1)");

    mockSend.mockClear();
    mockHealed.mockRejectedValue(new Error("db down"));
    expect(await (await call("Bearer s3cret")).json()).toEqual({ sent: true });
  });

  it("emails the weekly digest when authorised", async () => {
    const response = await call("Bearer s3cret");

    expect(await response.json()).toEqual({ sent: true });
    expect(mockData).toHaveBeenCalledWith(7);
    expect(mockSend.mock.calls[0][0].text).toContain("https://me.example/admin/analytics");
  });

  it("reports a provider failure as not sent and hides internal errors", async () => {
    mockSend.mockResolvedValue("failed");
    expect(await (await call("Bearer s3cret")).json()).toEqual({ sent: false });

    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
    mockData.mockRejectedValue(new Error("postgres://secret"));
    const response = await call("Bearer s3cret");
    expect(response.status).toBe(500);
    expect(await response.text()).not.toContain("secret");
    consoleError.mockRestore();
  });
});
