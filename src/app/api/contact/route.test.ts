/**
 * @jest-environment node
 */
import { countRecentMessages, createMessage, listPendingNotifications, markMessageNotified } from "@/lib/analytics/repository";
import { sendEmail } from "@/lib/notify/email";

import { POST } from "./route";

jest.mock("@/lib/analytics/repository", () => ({ countRecentMessages: jest.fn(), createMessage: jest.fn(), listPendingNotifications: jest.fn(), markMessageNotified: jest.fn() }));
jest.mock("@/lib/heal", () => ({ recordHeal: jest.fn() }));
// `after` only works inside a real Next.js request, so run the callback straight away and let tests wait for it.
const mockAfterTasks: Promise<unknown>[] = [];
const afterTasks = () => Promise.all(mockAfterTasks.splice(0));
jest.mock("next/server", () => ({ ...jest.requireActual("next/server"), after: (callback: () => unknown) => void mockAfterTasks.push(Promise.resolve(callback())) }));
jest.mock("@/lib/notify/email", () => ({ sendEmail: jest.fn() }));

const mockCount = jest.mocked(countRecentMessages);
const mockCreate = jest.mocked(createMessage);
const mockEmail = jest.mocked(sendEmail);
const mockPending = jest.mocked(listPendingNotifications);
const mockMarked = jest.mocked(markMessageNotified);

const valid = { name: "Ada", email: "ada@example.com", message: "Hello, I would like to talk about a role." };

function send(body: unknown, headers: Record<string, string> = {}) {
  return POST(new Request("http://localhost/api/contact", {
    method: "POST",
    headers: { host: "localhost", "user-agent": "Mozilla/5.0", "x-forwarded-for": "1.2.3.4", ...headers },
    body: JSON.stringify(body),
  }));
}

beforeEach(() => {
  mockCount.mockResolvedValue(0);
  mockCreate.mockResolvedValue("message-id");
  mockEmail.mockResolvedValue("sent");
  mockPending.mockResolvedValue([]);
  mockMarked.mockResolvedValue(undefined);
});

describe("/api/contact", () => {
  it("stores a valid message with a hashed sender id", async () => {
    const response = await send(valid);

    expect(response.status).toBe(201);
    expect(mockCreate).toHaveBeenCalledWith({ ...valid, senderHash: expect.stringMatching(/^[0-9a-f]{32}$/) });
  });

  it("emails the owner about a new message with a link to the dashboard", async () => {
    await send(valid);

    expect(mockEmail).toHaveBeenCalledTimes(1);
    const { subject, text } = mockEmail.mock.calls[0][0];
    expect(subject).toBe("New portfolio message from Ada");
    expect(text).toContain("ada@example.com");
    expect(text).toContain(valid.message);
    expect(text).toContain("http://localhost/admin/analytics");
  });

  it("marks the message as notified once the email has gone out", async () => {
    await send(valid);
    await afterTasks();

    expect(mockMarked).toHaveBeenCalledWith("message-id");
  });

  it("leaves the message pending when the email fails, so it is retried later, and does not retry others", async () => {
    mockEmail.mockResolvedValue("failed");

    expect((await send(valid)).status).toBe(201);
    await afterTasks();

    expect(mockMarked).not.toHaveBeenCalled();
    expect(mockPending).not.toHaveBeenCalled();
  });

  it("catches up on earlier unsent notifications once the provider works again", async () => {
    mockPending.mockResolvedValue([{ id: "old", name: "Bob", email: "bob@example.com", message: "An earlier message that never got emailed." }]);

    await send(valid);
    await afterTasks();

    expect(mockEmail).toHaveBeenCalledTimes(2);
    expect(mockEmail.mock.calls[1][0]).toMatchObject({ subject: "[Resent] New portfolio message from Bob", replyTo: "bob@example.com" });
    expect(mockMarked).toHaveBeenCalledWith("old");
  });

  it("sets Reply-To to the visitor so the owner can answer from their inbox", async () => {
    await send(valid);

    expect(mockEmail.mock.calls[0][0].replyTo).toBe("ada@example.com");
  });

  it("answers the visitor without waiting for the email provider", async () => {
    mockEmail.mockReturnValue(new Promise(() => undefined));

    const response = await send(valid);

    expect(response.status).toBe(201);
  });

  it("still succeeds when the notification email fails", async () => {
    mockEmail.mockResolvedValue("failed");

    const response = await send(valid);

    expect(response.status).toBe(201);
    expect(mockCreate).toHaveBeenCalled();
  });

  it("does not email for rejected, spam or rate-limited submissions", async () => {
    await send({ name: "", email: "bad", message: "hi" });
    await send({ ...valid, website: "http://spam.example" });
    mockCount.mockResolvedValue(3);
    await send(valid);

    expect(mockEmail).not.toHaveBeenCalled();
  });

  it("returns structured validation errors and stores nothing", async () => {
    const response = await send({ name: "", email: "bad", message: "hi" });

    expect(response.status).toBe(400);
    expect((await response.json()).errors).toEqual(expect.arrayContaining(["name is required", "email must be a valid address"]));
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("silently accepts but discards honeypot submissions", async () => {
    const response = await send({ ...valid, website: "http://spam.example" });

    expect(response.status).toBe(201);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("rate limits repeat senders", async () => {
    mockCount.mockResolvedValue(3);

    const response = await send(valid);

    expect(response.status).toBe(429);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("rejects cross-origin posts", async () => {
    const response = await send(valid, { origin: "https://evil.example" });

    expect(response.status).toBe(403);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("hides internal errors", async () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
    mockCreate.mockRejectedValue(new Error("postgres://secret"));

    const response = await send(valid);

    expect(response.status).toBe(500);
    expect(await response.text()).not.toContain("secret");
    consoleError.mockRestore();
  });
});
