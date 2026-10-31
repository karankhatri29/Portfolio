import type { Metadata } from "next";

import { auth } from "@/auth";
import { AdminGate } from "@/components/AdminGate";
import { AdminShell } from "@/components/AdminShell";
import { BlogEditor } from "@/components/BlogEditor";
import { listPostsForAdmin } from "@/lib/content/blog";

export const metadata: Metadata = { title: "Write blog posts", robots: { index: false, follow: false } };

export default async function AdminBlogPage() {
  const session = await auth();
  const posts = session?.role === "Admin" ? await listPostsForAdmin() : [];

  return (
    <AdminShell current="blog" title="Blog" description="Write, preview and publish posts. Drafts stay private until you publish them." signedIn={session?.role === "Admin"} wide>
      <AdminGate session={session}>
        <BlogEditor initialPosts={posts} />
      </AdminGate>
    </AdminShell>
  );
}
