/**
 * @jest-environment node
 */
import { askGemini } from "@/lib/ask/gemini";
import { countAsksToday, countRecentAsks, recordAsk } from "@/lib/ask/repository";

import { POST } from "./route";

jest.mock("@/lib/ask/gemini", () => ({ askGemini: jest.fn() }));
jest.mock("@/lib/ask/repository", () => ({ countRecentAsks: jest.fn(), countAsksToday: jest.fn(), recordAsk: jest.fn(), pruneOldAsks: jest.fn().mockResolvedValue(undefined) }));
jest.mock("@/lib/content/repository", () => ({ listProjects: jest.fn().mockResolvedValue([]), listSkills: jest.fn().mockResolvedValue([]) }));

const gemini = jest.mocked(askGemini);
const hourly = jest.mocked(countRecentAsks);
const daily = jest.mocked(countAsksToday);
const record = jest.mocked(recordAsk);

function ask(body: unknown, headers: Record<string, string> = {}) {
  return POST(new Request("http://localhost/api/ask", { method: "POST", headers: { host: "localhost", "content-type": "application/json", "x-forwarded-for": "1.2.3.4", "user-agent": "jest", ...headers }, body: typeof body === "string" ? body : JSON.stringify(body) }));
}

describe("POST /api/ask", () => {
  const env = { ...process.env };

  beforeEach(() => {
    process.env.GEMINI_API_KEY = "test-key";
    delete process.env.ASK_LOG_QUESTIONS;
    hourly.mockResolvedValue(0);
    daily.mockResolvedValue(0);
    record.mockResolvedValue(undefined);
    gemini.mockResolvedValue({ ok: true, text: "He built Email Triage." });
    jest.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    process.env = { ...env };
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it("answers a valid question using the site's facts", async () => {
    const response = await ask({ question: "What has Karan built?" });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ answer: "He built Email Triage." });
    const call = gemini.mock.calls[0][0];
    expect(call.question).toBe("What has Karan built?");
    expect(call.systemPrompt).toContain("Karan Kaushik Khatri");
    expect(call.systemPrompt).toContain("Use ONLY the FACTS below");
  });

  it("rejects invalid questions before touching the database or the model", async () => {
    for (const body of [{}, { question: "hi" }, { question: "x".repeat(201) }, "not json"]) {
      const response = await ask(body);
      expect(response.status).toBe(400);
    }
    expect(hourly).not.toHaveBeenCalled();
    expect(gemini).not.toHaveBeenCalled();
  });

  it("refuses cross-site requests and oversized bodies", async () => {
    expect((await ask({ question: "What has Karan built?" }, { origin: "https://evil.example" })).status).toBe(403);
    expect((await ask({ question: "What has Karan built?" }, { "content-length": "5000" })).status).toBe(413);
    expect(gemini).not.toHaveBeenCalled();
  });

  it("stops at the per-visitor hourly limit and the site-wide daily limit", async () => {
    hourly.mockResolvedValue(10);
    const perVisitor = await ask({ question: "What has Karan built?" });
    expect(perVisitor.status).toBe(429);
    expect((await perVisitor.json()).error).toMatch(/email Karan/);

    hourly.mockResolvedValue(0);
    daily.mockResolvedValue(300);
    expect((await ask({ question: "What has Karan built?" })).status).toBe(429);
    expect(gemini).not.toHaveBeenCalled();
    expect(record).not.toHaveBeenCalled();
  });

  it("honours limits set in the environment", async () => {
    process.env.ASK_HOURLY_LIMIT = "2";
    hourly.mockResolvedValue(2);

    expect((await ask({ question: "What has Karan built?" })).status).toBe(429);
  });

  it("does not store the question text unless logging is switched on", async () => {
    await ask({ question: "What has Karan built?" });
    expect(record).toHaveBeenLastCalledWith(expect.any(String), "");

    process.env.ASK_LOG_QUESTIONS = "true";
    await ask({ question: "What has Karan built?" });
    expect(record).toHaveBeenLastCalledWith(expect.any(String), "What has Karan built?");
  });

  it("stores only a hash of the visitor, never their address", async () => {
    await ask({ question: "What has Karan built?" });

    const stored = record.mock.calls[0][0];
    expect(stored).toMatch(/^[0-9a-f]{32}$/);
    expect(stored).not.toContain("1.2.3.4");
  });

  it("counts the request even when the model then fails", async () => {
    gemini.mockResolvedValue({ ok: false, reason: "unavailable" });

    const response = await ask({ question: "What has Karan built?" });

    expect(response.status).toBe(502);
    expect((await response.json()).error).toMatch(/email Karan/);
    expect(record).toHaveBeenCalledTimes(1);
  });

  it("maps each model failure to a friendly message, and a block to a normal answer", async () => {
    gemini.mockResolvedValue({ ok: false, reason: "quota" });
    expect((await ask({ question: "What has Karan built?" })).status).toBe(502);

    gemini.mockResolvedValue({ ok: false, reason: "blocked" });
    const blocked = await ask({ question: "What has Karan built?" });
    expect(blocked.status).toBe(200);
    expect(await blocked.json()).toEqual({ answer: "I can only answer questions about Karan and his work." });
  });

  it("says so plainly when the key is not configured, and never echoes it", async () => {
    delete process.env.GEMINI_API_KEY;

    const response = await ask({ question: "What has Karan built?" });

    expect(response.status).toBe(503);
    expect(JSON.stringify(await response.json())).not.toContain("test-key");
  });

  it("returns a friendly error if something unexpected throws", async () => {
    hourly.mockRejectedValue(new Error("db down"));

    const response = await ask({ question: "What has Karan built?" });

    expect(response.status).toBe(500);
    expect((await response.json()).error).toMatch(/email Karan/);
  });
});
