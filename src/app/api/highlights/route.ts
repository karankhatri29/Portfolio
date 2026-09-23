import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { createHighlight, deleteHighlight, listHighlights, updateHighlight } from "@/lib/content/repository";
import { validateHighlightInput } from "@/lib/content/schemas";

async function requireAdmin() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  if (session.role !== "Admin") return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  return null;
}

async function handle(run: () => Promise<Response>) {
  try {
    return await run();
  } catch (error) {
    console.error("highlights route failed", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

function readId(payload: unknown): string | undefined {
  const id = payload && typeof payload === "object" ? (payload as Record<string, unknown>).id : undefined;
  return typeof id === "string" && id.length > 0 ? id : undefined;
}

export function GET() {
  return handle(async () => {
    const denied = await requireAdmin();
    if (denied) return denied;

    return NextResponse.json({ highlights: await listHighlights() });
  });
}

export function POST(request: Request) {
  return handle(async () => {
    const denied = await requireAdmin();
    if (denied) return denied;

    const result = validateHighlightInput(await request.json().catch(() => null));
    if (!result.valid) return NextResponse.json({ errors: result.errors }, { status: 400 });

    return NextResponse.json({ highlight: await createHighlight(result.data) }, { status: 201 });
  });
}

export function PATCH(request: Request) {
  return handle(async () => {
    const denied = await requireAdmin();
    if (denied) return denied;

    const payload = await request.json().catch(() => null);
    const id = readId(payload);
    if (!id) return NextResponse.json({ errors: ["id is required"] }, { status: 400 });

    const result = validateHighlightInput(payload);
    if (!result.valid) return NextResponse.json({ errors: result.errors }, { status: 400 });

    const highlight = await updateHighlight(id, result.data);
    if (!highlight) return NextResponse.json({ error: "Entry not found" }, { status: 404 });

    return NextResponse.json({ highlight });
  });
}

export function DELETE(request: Request) {
  return handle(async () => {
    const denied = await requireAdmin();
    if (denied) return denied;

    const id = readId(await request.json().catch(() => null));
    if (!id) return NextResponse.json({ errors: ["id is required"] }, { status: 400 });

    if (!(await deleteHighlight(id))) return NextResponse.json({ error: "Entry not found" }, { status: 404 });

    return NextResponse.json({ ok: true });
  });
}
