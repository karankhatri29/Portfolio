import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { createProject, deleteProject, getProject, listProjects, updateProject } from "@/lib/content/repository";
import { validateProjectInput } from "@/lib/content/schemas";

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
    console.error("projects route failed", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export function GET() {
  return handle(async () => {
    const denied = await requireAdmin();
    if (denied) return denied;

    return NextResponse.json({ projects: await listProjects() });
  });
}

export function POST(request: Request) {
  return handle(async () => {
    const denied = await requireAdmin();
    if (denied) return denied;

    const result = validateProjectInput(await request.json().catch(() => null));
    if (!result.valid) return NextResponse.json({ errors: result.errors }, { status: 400 });

    if (await getProject(result.data.slug)) {
      return NextResponse.json({ error: "A project with this slug already exists" }, { status: 409 });
    }

    return NextResponse.json({ project: await createProject(result.data) }, { status: 201 });
  });
}

export function PATCH(request: Request) {
  return handle(async () => {
    const denied = await requireAdmin();
    if (denied) return denied;

    const result = validateProjectInput(await request.json().catch(() => null));
    if (!result.valid) return NextResponse.json({ errors: result.errors }, { status: 400 });

    const project = await updateProject(result.data.slug, result.data);
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    return NextResponse.json({ project });
  });
}

export function DELETE(request: Request) {
  return handle(async () => {
    const denied = await requireAdmin();
    if (denied) return denied;

    const payload = await request.json().catch(() => null);
    const slug = payload && typeof payload === "object" ? (payload as Record<string, unknown>).slug : undefined;
    if (typeof slug !== "string" || slug.length === 0) {
      return NextResponse.json({ errors: ["slug is required"] }, { status: 400 });
    }

    if (!(await deleteProject(slug))) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    return NextResponse.json({ ok: true });
  });
}
