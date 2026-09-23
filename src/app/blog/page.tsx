import type { Metadata } from "next";
import Link from "next/link";

import { listBlogPosts } from "@/lib/content/blog";

export const metadata: Metadata = {
  title: "Writing and research",
  description: "Notes on applied AI, NLP, knowledge graphs and building useful systems.",
  alternates: { canonical: "/blog" },
};

export default async function BlogIndexPage() {
  const posts = await listBlogPosts();

  return (
    <main className="mx-auto max-w-4xl px-5 py-20 lg:px-8 lg:py-32">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">Writing and research</p>
      <h1 className="mt-4 font-display text-5xl font-semibold tracking-tight sm:text-7xl">Writing and research</h1>
      <div className="mt-14 space-y-8">
        {posts.map((post) => (
          <article key={post.slug} className="border-t border-ink/10 pt-6">
            <p className="text-sm text-muted">{post.date}</p>
            <h2 className="mt-2 font-display text-3xl font-semibold"><Link href={`/blog/${post.slug}`} className="hover:text-accent">{post.title}</Link></h2>
            <p className="mt-3 leading-7 text-muted">{post.summary}</p>
          </article>
        ))}
      </div>
    </main>
  );
}
