import { NextResponse, after } from "next/server";

import { countRecentMessages, createMessage } from "@/lib/analytics/repository";
import { visitorHash } from "@/lib/analytics/tracking";
import { notifyContactMessage, resendPendingNotifications } from "@/lib/notify/contact";
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

    const id = await createMessage({ ...result.data, senderHash });

    // Best effort and after the response: the message is already saved, so a slow or failing mail provider must neither
    // delay the visitor nor fail the request. If the email cannot go out it stays pending and is retried later.
    const siteOrigin = new URL(request.url).origin;
    after(async () => {
      if (await notifyContactMessage({ id, ...result.data }, siteOrigin)) await resendPendingNotifications(siteOrigin);
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("contact route failed", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
