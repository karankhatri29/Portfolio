import { cleanAnswer } from "@/lib/ask/prompt";

export const DEFAULT_MODEL = "gemini-2.5-flash";
// Used when the main model is unreachable, over quota or retired. "off" in GEMINI_FALLBACK_MODEL disables it.
export const DEFAULT_FALLBACK_MODEL = "gemini-3.5-flash-lite";

export type GeminiResult = { ok: true; text: string; fallback?: true } | { ok: false; reason: "not-configured" | "quota" | "unavailable" | "blocked" | "empty" };

type Options = {
  question: string;
  systemPrompt: string;
  apiKey?: string;
  model?: string;
  /** Tried once if the main model fails in a way that another model could fix. Defaults to GEMINI_FALLBACK_MODEL. */
  fallbackModel?: string | null;
  timeoutMs?: number;
  fallbackTimeoutMs?: number;
  fetchImpl?: typeof fetch;
};

type GeminiResponse = {
  candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[];
  promptFeedback?: { blockReason?: string };
};

type Attempt = GeminiResult & { retryable?: boolean };

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

function fallbackFromEnv(): string | null {
  const configured = process.env.GEMINI_FALLBACK_MODEL?.trim();
  if (!configured) return DEFAULT_FALLBACK_MODEL;
  return configured.toLowerCase() === "off" ? null : configured;
}

// Gemini 2.5 Flash "thinks" by default, which eats a small output budget and leaves truncated answers, so thinking is
// switched off for it. The 3.x Flash-Lite models take a level instead; other models keep their defaults.
function thinkingConfig(model: string) {
  if (model === "gemini-2.5-flash") return { thinkingBudget: 0 };
  if (/^gemini-3(\.\d+)?-flash-lite/.test(model)) return { thinkingLevel: "minimal" };
  return undefined;
}

async function attempt(model: string, key: string, { question, systemPrompt }: Pick<Options, "question" | "systemPrompt">, timeoutMs: number, fetchImpl: typeof fetch): Promise<Attempt> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const thinking = thinkingConfig(model);
    const response = await fetchImpl(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": key },
      signal: controller.signal,
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: "user", parts: [{ text: question }] }],
        generationConfig: { maxOutputTokens: 160, temperature: 0.2, ...(thinking ? { thinkingConfig: thinking } : {}) },
      }),
    });

    if (response.status === 429) return { ok: false, reason: "quota", retryable: true };
    if (!response.ok) {
      console.error("gemini request failed", { status: response.status, model });
      // A server error or a retired model (404) is worth trying another model for; a bad key (400, 401, 403) is not.
      return { ok: false, reason: "unavailable", retryable: response.status >= 500 || response.status === 404 };
    }

    const data = (await response.json()) as GeminiResponse;
    if (data.promptFeedback?.blockReason || data.candidates?.[0]?.finishReason === "SAFETY") return { ok: false, reason: "blocked" };

    const text = cleanAnswer(data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("") ?? "");
    return text ? { ok: true, text } : { ok: false, reason: "empty" };
  } catch (error) {
    console.error("gemini request errored", { ...describeFailure(error, key), model });
    return { ok: false, reason: "unavailable", retryable: true };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Asks Gemini once for a short answer, and once more on a fallback model if the main one is down, over quota or gone.
 * Server-side only: the key comes from the environment and is never logged or returned. The two timeouts add up to
 * less than a serverless function's default limit.
 */
export async function askGemini({ question, systemPrompt, apiKey = process.env.GEMINI_API_KEY, model = process.env.GEMINI_MODEL || DEFAULT_MODEL, fallbackModel = fallbackFromEnv(), timeoutMs = 6000, fallbackTimeoutMs = 4000, fetchImpl = fetch }: Options): Promise<GeminiResult> {
  const key = cleanKey(apiKey);
  if (!key) return { ok: false, reason: "not-configured" };

  const { retryable, ...first } = await attempt(model, key, { question, systemPrompt }, timeoutMs, fetchImpl);
  if (first.ok || !retryable || !fallbackModel || fallbackModel === model) return first;

  const second = await attempt(fallbackModel, key, { question, systemPrompt }, fallbackTimeoutMs, fetchImpl);
  // Report the main model's reason (quota vs unavailable) when both fail.
  return second.ok ? { ok: true, text: second.text, fallback: true } : first;
}
