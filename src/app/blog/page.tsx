import type { Metadata } from "next";
import Link from "next/link";

import { formatPostDate } from "@/lib/content/blog-utils";
import { listBlogPosts } from "@/lib/content/blog";

export const metadata: Metadata = {
  title: "Writing and research",
  description: "Notes on applied AI, NLP, knowledge graphs and building useful systems.",
  alternates: { canonical: "/blog" },
};

export default async function BlogIndexPage({ searchParams }: { searchParams: Promise<{ tag?: string }> }) {
  const { tag } = await searchParams;
  const all = await listBlogPosts();
  const tags = [...new Set(all.flatMap((post) => post.tags))].sort();
  const posts = tag ? all.filter((post) => post.tags.includes(tag)) : all;

  return (
    <main className="mx-auto max-w-4xl px-5 py-16 lg:px-8 lg:py-28">
      <Link href="/" className="text-sm font-semibold text-accent underline underline-offset-4">Home</Link>
      <p className="mt-8 text-sm font-semibold uppercase tracking-[0.2em] text-accent">Writing and research</p>
      <h1 className="mt-4 font-display text-5xl font-semibold tracking-tight sm:text-7xl">Writing and research</h1>
      <p className="mt-6 text-sm text-muted"><a href="/feed.xml" className="underline underline-offset-4 hover:text-accent">Subscribe with RSS</a></p>

      {tags.length > 0 ? (
        <nav aria-label="Filter by tag" className="mt-8 flex flex-wrap gap-2">
          <Link href="/blog" aria-current={tag ? undefined : "page"} className={`rounded-full border px-3 py-1 text-xs ${tag ? "border-ink/15 text-muted hover:border-accent" : "border-accent bg-accent text-paper"}`}>All</Link>
          {tags.map((item) => (
            <Link key={item} href={`/blog?tag=${encodeURIComponent(item)}`} aria-current={tag === item ? "page" : undefined} className={`rounded-full border px-3 py-1 text-xs ${tag === item ? "border-accent bg-accent text-paper" : "border-ink/15 text-muted hover:border-accent"}`}>{item}</Link>
          ))}
        </nav>
      ) : null}

      <div className="mt-14 space-y-8">
        {posts.length === 0 ? <p className="text-muted">{tag ? `No posts tagged "${tag}" yet.` : "New writing is on the way."}</p> : null}
        {posts.map((post) => (
          <article key={post.slug} className="border-t border-ink/10 pt-6">
            <p className="text-sm text-muted"><time dateTime={post.date}>{formatPostDate(post.date)}</time> · {post.readingMinutes} min read</p>
            <h2 className="mt-2 font-display text-3xl font-semibold"><Link href={`/blog/${post.slug}`} className="hover:text-accent">{post.title}</Link></h2>
            <p className="mt-3 leading-7 text-muted">{post.summary}</p>
            {post.tags.length > 0 ? <ul aria-label={`Tags for ${post.title}`} className="mt-3 flex flex-wrap gap-2">{post.tags.map((item) => <li key={item} className="rounded-full border border-ink/15 px-3 py-0.5 text-xs text-muted">{item}</li>)}</ul> : null}
          </article>
        ))}
      </div>
    </main>
  );
}
