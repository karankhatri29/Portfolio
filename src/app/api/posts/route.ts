import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { createPost, deletePost, listPostsForAdmin, postExists, updatePost } from "@/lib/content/blog";
import { validatePostInput } from "@/lib/content/schemas";

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
    console.error("posts route failed", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export function GET() {
  return handle(async () => {
    const denied = await requireAdmin();
    if (denied) return denied;

    return NextResponse.json({ posts: await listPostsForAdmin() });
  });
}

export function POST(request: Request) {
  return handle(async () => {
    const denied = await requireAdmin();
    if (denied) return denied;

    const result = validatePostInput(await request.json().catch(() => null));
    if (!result.valid) return NextResponse.json({ errors: result.errors }, { status: 400 });

    if (await postExists(result.data.slug)) return NextResponse.json({ error: "A post with this slug already exists" }, { status: 409 });

    return NextResponse.json({ post: await createPost(result.data) }, { status: 201 });
  });
}

export function PATCH(request: Request) {
  return handle(async () => {
    const denied = await requireAdmin();
    if (denied) return denied;

    const result = validatePostInput(await request.json().catch(() => null));
    if (!result.valid) return NextResponse.json({ errors: result.errors }, { status: 400 });

    const { slug, ...rest } = result.data;
    const post = await updatePost(slug, rest);
    if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

    return NextResponse.json({ post });
  });
}

export function DELETE(request: Request) {
  return handle(async () => {
    const denied = await requireAdmin();
    if (denied) return denied;

    const payload = await request.json().catch(() => null);
    const slug = payload && typeof payload === "object" ? (payload as Record<string, unknown>).slug : undefined;
    if (typeof slug !== "string" || slug.length === 0) return NextResponse.json({ errors: ["slug is required"] }, { status: 400 });

    if (!(await deletePost(slug))) return NextResponse.json({ error: "Post not found" }, { status: 404 });

    return NextResponse.json({ ok: true });
  });
}
