import Link from "next/link";

import { auth } from "@/auth";
import { AdminGate } from "@/components/AdminGate";
import { BlogEditor } from "@/components/BlogEditor";
import { listPostsForAdmin } from "@/lib/content/blog";

export default async function AdminBlogPage() {
  const session = await auth();
  const posts = session?.role === "Admin" ? await listPostsForAdmin() : [];

  return (
    <main className="mx-auto max-w-4xl px-5 py-20 lg:px-8 lg:py-28">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">Admin</p>
      <h1 className="mt-4 font-display text-5xl font-semibold tracking-tight sm:text-6xl">Blog</h1>
      {session?.role === "Admin" ? <p className="mt-6 flex gap-6 text-sm font-semibold"><Link href="/admin" className="text-accent underline underline-offset-4">Manage content</Link><Link href="/admin/analytics" className="text-accent underline underline-offset-4">View analytics</Link></p> : null}
      <div className="mt-14">
        <AdminGate session={session}>
          <BlogEditor initialPosts={posts} />
        </AdminGate>
      </div>
    </main>
  );
}
