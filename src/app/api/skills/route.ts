import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { createSkill, deleteSkill, listSkills, updateSkill } from "@/lib/content/repository";
import { validateSkillInput } from "@/lib/content/schemas";

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
    console.error("skills route failed", error);
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

    return NextResponse.json({ skills: await listSkills() });
  });
}

export function POST(request: Request) {
  return handle(async () => {
    const denied = await requireAdmin();
    if (denied) return denied;

    const result = validateSkillInput(await request.json().catch(() => null));
    if (!result.valid) return NextResponse.json({ errors: result.errors }, { status: 400 });

    return NextResponse.json({ skill: await createSkill(result.data) }, { status: 201 });
  });
}

export function PATCH(request: Request) {
  return handle(async () => {
    const denied = await requireAdmin();
    if (denied) return denied;

    const payload = await request.json().catch(() => null);
    const id = readId(payload);
    if (!id) return NextResponse.json({ errors: ["id is required"] }, { status: 400 });

    const result = validateSkillInput(payload);
    if (!result.valid) return NextResponse.json({ errors: result.errors }, { status: 400 });

    const skill = await updateSkill(id, result.data);
    if (!skill) return NextResponse.json({ error: "Competency not found" }, { status: 404 });

    return NextResponse.json({ skill });
  });
}

export function DELETE(request: Request) {
  return handle(async () => {
    const denied = await requireAdmin();
    if (denied) return denied;

    const id = readId(await request.json().catch(() => null));
    if (!id) return NextResponse.json({ errors: ["id is required"] }, { status: 400 });

    if (!(await deleteSkill(id))) return NextResponse.json({ error: "Competency not found" }, { status: 404 });

    return NextResponse.json({ ok: true });
  });
}
