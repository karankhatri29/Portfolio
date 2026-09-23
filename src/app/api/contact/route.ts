import { NextResponse } from "next/server";

import { countRecentMessages, createMessage } from "@/lib/analytics/repository";
import { visitorHash } from "@/lib/analytics/tracking";
import { sendEmail } from "@/lib/notify/email";
import { validateContactInput } from "@/lib/contact/validation";

const MAX_MESSAGES_PER_WINDOW = 3;
const WINDOW_MINUTES = 10;

export async function POST(request: Request) {
  try {
    const origin = request.headers.get("origin");
    if (origin && new URL(origin).host !== request.headers.get("host")) {
      return NextResponse.json({ error: "Request not allowed" }, { status: 403 });
    }

    const payload = await request.json().catch(() => null);

    // Hidden field only bots fill in: pretend it worked so they do not retry.
    if (payload && typeof payload === "object" && (payload as Record<string, unknown>).website) {
      return NextResponse.json({ ok: true }, { status: 201 });
    }

    const result = validateContactInput(payload);
    if (!result.valid) return NextResponse.json({ errors: result.errors }, { status: 400 });

    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const senderHash = visitorHash(ip, request.headers.get("user-agent") ?? "", process.env.AUTH_SECRET ?? "dev-salt");

    if ((await countRecentMessages(senderHash, WINDOW_MINUTES)) >= MAX_MESSAGES_PER_WINDOW) {
      return NextResponse.json({ error: "Too many messages. Please try again in a few minutes." }, { status: 429 });
    }

    await createMessage({ ...result.data, senderHash });

    // Best effort: the message is already saved, so a mail problem must not fail the request.
    await sendEmail({
      subject: `New portfolio message from ${result.data.name}`,
      text: `${result.data.name} <${result.data.email}> wrote:\n\n${result.data.message}\n\nReply to them directly, or manage messages at ${new URL(request.url).origin}/admin/analytics`,
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("contact route failed", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
