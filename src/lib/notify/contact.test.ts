/**
 * @jest-environment node
 */
import { listPendingNotifications, markMessageNotified } from "@/lib/analytics/repository";
import { recordHeal } from "@/lib/heal";
import { notifyContactMessage, resendPendingNotifications } from "@/lib/notify/contact";
import { sendEmail } from "@/lib/notify/email";

jest.mock("@/lib/analytics/repository", () => ({ listPendingNotifications: jest.fn(), markMessageNotified: jest.fn() }));
jest.mock("@/lib/notify/email", () => ({ sendEmail: jest.fn() }));
jest.mock("@/lib/heal", () => ({ recordHeal: jest.fn() }));

const mockSend = jest.mocked(sendEmail);
const mockPending = jest.mocked(listPendingNotifications);
const mockMarked = jest.mocked(markMessageNotified);
const message = { id: "m1", name: "Ada", email: "ada@example.com", message: "Hello there, a longer message." };

beforeEach(() => {
  mockSend.mockResolvedValue("sent");
  mockMarked.mockResolvedValue(undefined);
  mockPending.mockResolvedValue([]);
});

describe("notifyContactMessage", () => {
  it("emails with Reply-To and a dashboard link, then marks the message as notified", async () => {
    expect(await notifyContactMessage(message, "https://me.example")).toBe(true);

    expect(mockSend.mock.calls[0][0]).toMatchObject({ subject: "New portfolio message from Ada", replyTo: "ada@example.com" });
    expect(mockSend.mock.calls[0][0].text).toContain("https://me.example/admin/analytics");
    expect(mockMarked).toHaveBeenCalledWith("m1");
  });

  it("leaves it pending when the provider failed or email is not configured", async () => {
    for (const result of ["failed", "skipped"] as const) {
      mockSend.mockResolvedValue(result);
      expect(await notifyContactMessage(message, "https://me.example")).toBe(false);
    }
    expect(mockMarked).not.toHaveBeenCalled();
  });

  it("still reports success if marking it fails, rather than risking a duplicate by retrying", async () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => undefined);
    mockMarked.mockRejectedValue(new Error("db down"));

    expect(await notifyContactMessage(message, "https://me.example")).toBe(true);
    consoleError.mockRestore();
  });
});

describe("resendPendingNotifications", () => {
  it("re-sends each pending message, labelled, and records the recovery", async () => {
    mockPending.mockResolvedValue([message, { ...message, id: "m2", name: "Bob" }]);

    expect(await resendPendingNotifications("https://me.example")).toBe(2);

    expect(mockSend.mock.calls.map(([mail]) => mail.subject)).toEqual(["[Resent] New portfolio message from Ada", "[Resent] New portfolio message from Bob"]);
    expect(recordHeal).toHaveBeenCalledWith("email", "email-resent");
  });

  it("stops at the first failure instead of hammering a provider that is down", async () => {
    mockPending.mockResolvedValue([message, { ...message, id: "m2" }]);
    mockSend.mockResolvedValue("failed");

    expect(await resendPendingNotifications("https://me.example")).toBe(0);
    expect(mockSend).toHaveBeenCalledTimes(1);
  });

  it("never throws, even if the database is unreachable", async () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => undefined);
    mockPending.mockRejectedValue(new Error("fetch failed"));

    expect(await resendPendingNotifications("https://me.example")).toBe(0);
    consoleError.mockRestore();
  });
});
