import { cleanAnswer } from "@/lib/ask/prompt";

export const DEFAULT_MODEL = "gemini-2.5-flash";

export type GeminiResult = { ok: true; text: string } | { ok: false; reason: "not-configured" | "quota" | "unavailable" | "blocked" | "empty" };

type Options = {
  question: string;
  systemPrompt: string;
  apiKey?: string;
  model?: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
};

type GeminiResponse = {
  candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[];
  promptFeedback?: { blockReason?: string };
};

/**
 * Calls Gemini once for a short answer. Server-side only: the key comes from the environment and is
 * never logged or returned. Gemini 2.5 Flash "thinks" by default, which eats a small output budget and
 * leaves truncated answers, so thinking is switched off for that model.
 */
// Keys pasted into a hosting dashboard often arrive with a trailing newline, spaces or wrapping quotes,
// which make the HTTP request throw a TypeError. Local .env parsers hide this, so tidy the key here.
function cleanKey(raw: string | undefined): string {
  return (raw ?? "").trim().replace(/^["']+|["']+$/g, "").trim();
}

// Explains a failed request without ever printing the key: the error text has the key removed
// and only short technical fields (such as a network error code) are included.
function describeFailure(error: unknown, key: string) {
  const name = error instanceof Error ? error.name : "unknown";
  const cause = error instanceof Error ? (error as { cause?: { code?: unknown; name?: unknown } }).cause : undefined;
  const code = typeof cause?.code === "string" ? cause.code : typeof cause?.name === "string" ? cause.name : undefined;
  const detail = error instanceof Error ? error.message.split(key).join("[redacted]").replace(/\s+/g, " ").slice(0, 120) : undefined;
  return { name, ...(code ? { code } : {}), ...(detail ? { detail } : {}) };
}

export async function askGemini({ question, systemPrompt, apiKey = process.env.GEMINI_API_KEY, model = process.env.GEMINI_MODEL || DEFAULT_MODEL, timeoutMs = 10000, fetchImpl = fetch }: Options): Promise<GeminiResult> {
  const key = cleanKey(apiKey);
  if (!key) return { ok: false, reason: "not-configured" };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchImpl(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": key },
      signal: controller.signal,
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: "user", parts: [{ text: question }] }],
        generationConfig: { maxOutputTokens: 160, temperature: 0.2, ...(model === "gemini-2.5-flash" ? { thinkingConfig: { thinkingBudget: 0 } } : {}) },
      }),
    });

    if (response.status === 429) return { ok: false, reason: "quota" };
    if (!response.ok) {
      console.error("gemini request failed", { status: response.status, model });
      return { ok: false, reason: "unavailable" };
    }

    const data = (await response.json()) as GeminiResponse;
    if (data.promptFeedback?.blockReason || data.candidates?.[0]?.finishReason === "SAFETY") return { ok: false, reason: "blocked" };

    const text = cleanAnswer(data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("") ?? "");
    return text ? { ok: true, text } : { ok: false, reason: "empty" };
  } catch (error) {
    console.error("gemini request errored", { ...describeFailure(error, key), model });
    return { ok: false, reason: "unavailable" };
  } finally {
    clearTimeout(timer);
  }
}
