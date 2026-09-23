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
export async function askGemini({ question, systemPrompt, apiKey = process.env.GEMINI_API_KEY, model = process.env.GEMINI_MODEL || DEFAULT_MODEL, timeoutMs = 10000, fetchImpl = fetch }: Options): Promise<GeminiResult> {
  if (!apiKey) return { ok: false, reason: "not-configured" };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchImpl(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
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
    console.error("gemini request errored", { name: error instanceof Error ? error.name : "unknown", model });
    return { ok: false, reason: "unavailable" };
  } finally {
    clearTimeout(timer);
  }
}
