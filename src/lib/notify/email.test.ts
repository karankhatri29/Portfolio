/**
 * @jest-environment node
 */
import { emailConfig, sendEmail } from "@/lib/notify/email";

const fetchMock = jest.fn();
const env = process.env as Record<string, string | undefined>;
const saved = { key: env.RESEND_API_KEY, to: env.NOTIFY_EMAIL, from: env.NOTIFY_FROM };

beforeEach(() => {
  fetchMock.mockReset();
  global.fetch = fetchMock as unknown as typeof fetch;
  env.RESEND_API_KEY = "re_test";
  env.NOTIFY_EMAIL = "me@example.com";
  delete env.NOTIFY_FROM;
});

afterAll(() => {
  env.RESEND_API_KEY = saved.key;
  env.NOTIFY_EMAIL = saved.to;
  env.NOTIFY_FROM = saved.from;
});

describe("emailConfig", () => {
  it("needs both the API key and a recipient", () => {
    expect(emailConfig()).toMatchObject({ apiKey: "re_test", to: "me@example.com", from: "Portfolio <onboarding@resend.dev>" });

    delete env.NOTIFY_EMAIL;
    expect(emailConfig()).toBeNull();
  });
});

describe("sendEmail", () => {
  it("skips silently when email is not configured", async () => {
    delete env.RESEND_API_KEY;

    expect(await sendEmail({ subject: "s", text: "t" })).toBe("skipped");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("posts a plain-text message to the provider and strips newlines from the subject", async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200 });

    expect(await sendEmail({ subject: "Hello\r\nBcc: x@evil.test", text: "body" })).toBe("sent");

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.resend.com/emails");
    expect(init.headers.authorization).toBe("Bearer re_test");
    expect(JSON.parse(init.body)).toEqual({ from: "Portfolio <onboarding@resend.dev>", to: ["me@example.com"], subject: "Hello Bcc: x@evil.test", text: "body" });
  });

  it("reports failure instead of throwing when the provider errors or the network fails", async () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});

    fetchMock.mockResolvedValueOnce({ ok: false, status: 403 });
    expect(await sendEmail({ subject: "s", text: "t" })).toBe("failed");

    fetchMock.mockRejectedValueOnce(new Error("offline"));
    expect(await sendEmail({ subject: "s", text: "t" })).toBe("failed");

    consoleError.mockRestore();
  });
});
