import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { MESSAGE_STATUSES, setMessageStatus } from "@/lib/analytics/repository";
import type { MessageStatus } from "@/lib/analytics/repository";

export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    if (session.role !== "Admin") return NextResponse.json({ error: "Admin access required" }, { status: 403 });

    const payload = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    const id = typeof payload?.id === "string" ? payload.id : "";
    const status = payload?.status as MessageStatus;
    if (!id || !MESSAGE_STATUSES.includes(status)) {
      return NextResponse.json({ errors: ["id and a valid status are required"] }, { status: 400 });
    }

    if (!(await setMessageStatus(id, status))) return NextResponse.json({ error: "Message not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("messages route failed", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
