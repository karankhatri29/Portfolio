import type { Metadata } from "next";
import Link from "next/link";

import { CopyButton } from "@/components/CopyButton";
import { listBlogPosts } from "@/lib/content/blog";
import { siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Follow by RSS",
  description: "How to get new posts automatically with an RSS feed reader.",
  alternates: { canonical: "/rss" },
};

// Rendered per request, like the feed itself, so the list of posts is never stale.
export const dynamic = "force-dynamic";

export default async function RssPage() {
  const feedUrl = `${siteUrl()}/feed.xml`;
  const posts = await listBlogPosts().catch(() => []);

  return (
    <main className="mx-auto max-w-2xl px-5 py-20 lg:py-28">
      <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">Follow by RSS</h1>
      <p className="mt-5 text-lg leading-8 text-muted">
        RSS is a way to get new posts without visiting the site. A feed reader (Feedly, Inoreader, NetNewsWire and others) checks for you and shows
        anything new in one place. No account with me, no emails.
      </p>

      <section aria-labelledby="rss-steps" className="mt-12">
        <h2 id="rss-steps" className="font-display text-2xl font-semibold">How to follow</h2>
        <ol className="mt-5 list-decimal space-y-3 pl-6 leading-7 text-muted">
          <li>Open a feed reader and choose to add a feed.</li>
          <li>Paste this address:</li>
        </ol>
        <div className="mt-4 flex flex-wrap items-center gap-3 border border-accent/25 bg-ink/[0.035] p-4 backdrop-blur-xl">
          <code className="min-w-0 flex-1 break-all text-sm text-accent">{feedUrl}</code>
          <CopyButton value={feedUrl} label="Copy address" />
        </div>
        <p className="mt-3 text-sm text-muted">Many readers also find it on their own if you paste the site address instead.</p>
      </section>

      <section aria-labelledby="rss-latest" className="mt-14">
        <h2 id="rss-latest" className="font-display text-2xl font-semibold">What is in it now</h2>
        {posts.length ? (
          <ul className="mt-5 divide-y divide-ink/10 border-y border-ink/10">
            {posts.slice(0, 8).map((post) => (
              <li key={post.slug} className="py-4">
                <Link href={`/blog/${post.slug}`} className="font-semibold underline-offset-4 hover:text-accent hover:underline">{post.title}</Link>
                <p className="mt-1 text-sm text-muted">{post.summary}</p>
              </li>
            ))}
          </ul>
        ) : <p className="mt-5 text-muted">No posts yet. Once there are, they will appear here and in your reader.</p>}
      </section>

      <p className="mt-14 text-sm"><Link href="/" className="font-semibold text-accent underline underline-offset-4">Back to home</Link></p>
    </main>
  );
}
