export type EmailResult = "sent" | "skipped" | "failed";

type EmailConfig = { apiKey: string; to: string; from: string };

export function emailConfig(): EmailConfig | null {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.NOTIFY_EMAIL;
  if (!apiKey || !to) return null;

  return { apiKey, to, from: process.env.NOTIFY_FROM || "Portfolio <onboarding@resend.dev>" };
}

export async function sendEmail({ subject, text }: { subject: string; text: string }): Promise<EmailResult> {
  const config = emailConfig();
  if (!config) return "skipped";

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${config.apiKey}`, "content-type": "application/json" },
      body: JSON.stringify({ from: config.from, to: [config.to], subject: subject.replace(/[\r\n]+/g, " ").slice(0, 200), text }),
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      console.error("email provider rejected the message", response.status);
      return "failed";
    }
    return "sent";
  } catch (error) {
    console.error("email send failed", error);
    return "failed";
  }
}
