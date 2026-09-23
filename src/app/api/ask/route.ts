import { NextResponse } from "next/server";

import { visitorHash } from "@/lib/analytics/tracking";
import { portfolioContent } from "@/data/portfolio";
import { askGemini } from "@/lib/ask/gemini";
import { buildKnowledge, contactEmail } from "@/lib/ask/knowledge";
import { DEFAULT_DAILY_LIMIT, DEFAULT_HOURLY_LIMIT, LIMIT_MESSAGES, limitHit, readLimit } from "@/lib/ask/limits";
import { buildSystemPrompt, validateQuestion } from "@/lib/ask/prompt";
import { countAsksToday, countRecentAsks, pruneOldAsks, recordAsk } from "@/lib/ask/repository";
import { listProjects, listSkills } from "@/lib/content/repository";

const MAX_BODY_BYTES = 2000;

const FALLBACKS = {
  "not-configured": "The assistant isn't set up yet. Please email Karan directly.",
  quota: "The assistant is busy right now. Please try again shortly, or email Karan directly.",
  unavailable: "The assistant couldn't answer just now. Please try again, or email Karan directly.",
  blocked: "I can only answer questions about Karan and his work.",
  empty: "I couldn't come up with an answer to that. Try rephrasing, or email Karan directly.",
} as const;

export async function POST(request: Request) {
  try {
    const origin = request.headers.get("origin");
    if (origin && new URL(origin).host !== request.headers.get("host")) {
      return NextResponse.json({ error: "Request not allowed" }, { status: 403 });
    }

    const length = Number(request.headers.get("content-length") ?? 0);
    if (length > MAX_BODY_BYTES) return NextResponse.json({ error: "That question is too long." }, { status: 413 });

    const payload = await request.json().catch(() => null);
    const checked = validateQuestion(payload && typeof payload === "object" ? (payload as Record<string, unknown>).question : undefined);
    if (!checked.ok) return NextResponse.json({ error: checked.error }, { status: 400 });

    if (!process.env.GEMINI_API_KEY) return NextResponse.json({ error: FALLBACKS["not-configured"] }, { status: 503 });

    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const hash = visitorHash(ip, request.headers.get("user-agent") ?? "", process.env.AUTH_SECRET ?? "dev-salt");

    const [hourly, daily] = await Promise.all([countRecentAsks(hash, 60), countAsksToday()]);
    const hit = limitHit(
      { hourly, daily },
      { hourly: readLimit(process.env.ASK_HOURLY_LIMIT, DEFAULT_HOURLY_LIMIT), daily: readLimit(process.env.ASK_DAILY_LIMIT, DEFAULT_DAILY_LIMIT) },
    );
    if (hit) return NextResponse.json({ error: LIMIT_MESSAGES[hit] }, { status: 429 });

    // Counted before the model call so failing or slow requests cannot be used to hammer the API.
    await recordAsk(hash, process.env.ASK_LOG_QUESTIONS === "true" ? checked.question : "");
    if (Math.random() < 0.05) void pruneOldAsks().catch(() => undefined);

    // If the database is unreachable the assistant still knows everything in the static site content.
    const [projects, skills] = await Promise.all([listProjects().catch(() => []), listSkills().catch(() => [])]);
    const systemPrompt = buildSystemPrompt(buildKnowledge(portfolioContent, projects, skills), contactEmail(portfolioContent));

    const result = await askGemini({ question: checked.question, systemPrompt });
    // A blocked question is an expected outcome (off-topic or unsafe), so it reads as a normal answer.
    if (!result.ok) return result.reason === "blocked" ? NextResponse.json({ answer: FALLBACKS.blocked }) : NextResponse.json({ error: FALLBACKS[result.reason] }, { status: 502 });

    return NextResponse.json({ answer: result.text });
  } catch (error) {
    console.error("ask route failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: FALLBACKS.unavailable }, { status: 500 });
  }
}
