/**
 * @jest-environment node
 */
import { countRecentMessages, createMessage } from "@/lib/analytics/repository";

import { POST } from "./route";

jest.mock("@/lib/analytics/repository", () => ({ countRecentMessages: jest.fn(), createMessage: jest.fn() }));

const mockCount = jest.mocked(countRecentMessages);
const mockCreate = jest.mocked(createMessage);

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
});

describe("/api/contact", () => {
  it("stores a valid message with a hashed sender id", async () => {
    const response = await send(valid);

    expect(response.status).toBe(201);
    expect(mockCreate).toHaveBeenCalledWith({ ...valid, senderHash: expect.stringMatching(/^[0-9a-f]{32}$/) });
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
