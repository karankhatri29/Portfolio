/**
 * @jest-environment node
 */
import { countRecentMessages, createMessage } from "@/lib/analytics/repository";
import { sendEmail } from "@/lib/notify/email";

import { POST } from "./route";

jest.mock("@/lib/analytics/repository", () => ({ countRecentMessages: jest.fn(), createMessage: jest.fn() }));
jest.mock("@/lib/notify/email", () => ({ sendEmail: jest.fn() }));

const mockCount = jest.mocked(countRecentMessages);
const mockCreate = jest.mocked(createMessage);
const mockEmail = jest.mocked(sendEmail);

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
