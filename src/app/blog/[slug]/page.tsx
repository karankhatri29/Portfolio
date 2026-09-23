import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { auth } from "@/auth";
import { JsonLd } from "@/components/JsonLd";
import { MarkdownContent } from "@/components/MarkdownContent";
import { PostNav } from "@/components/PostNav";
import { ShareLinks } from "@/components/ShareLinks";
import { TableOfContents } from "@/components/TableOfContents";
import { extractHeadings, formatPostDate, readingMinutes } from "@/lib/content/blog-utils";
import { getBlogPost, listBlogPosts } from "@/lib/content/blog";
import { SITE_NAME, absoluteUrl } from "@/lib/site";

async function loadPost(slug: string) {
  const session = await auth();
  return getBlogPost(slug, { includeDrafts: session?.role === "Admin" });
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await loadPost(slug);
  if (!post) return {};

  return {
    title: post.title,
    description: post.summary,
    alternates: { canonical: `/blog/${post.slug}` },
    robots: post.status === "published" ? undefined : { index: false, follow: false },
    openGraph: { type: "article", title: post.title, description: post.summary, publishedTime: post.date || undefined, authors: [SITE_NAME], tags: post.tags },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await loadPost(slug);
  if (!post) notFound();

  const isDraft = post.status !== "published";
  const minutes = readingMinutes(post.content);
  const headings = extractHeadings(post.content);
  const published = await listBlogPosts().catch(() => []);
  const index = published.findIndex((item) => item.slug === post.slug);
  // The list is newest first, so the entry before this one is the newer post.
  const newer = index > 0 ? published[index - 1] : undefined;
  const older = index >= 0 ? published[index + 1] : undefined;
  const url = absoluteUrl(`/blog/${post.slug}`);

  return (
    <main className="mx-auto max-w-3xl px-5 py-16 lg:px-8 lg:py-28">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: post.title,
          description: post.summary,
          datePublished: post.date || undefined,
          keywords: post.tags.length > 0 ? post.tags.join(", ") : undefined,
          timeRequired: `PT${minutes}M`,
          author: { "@type": "Person", name: SITE_NAME },
          mainEntityOfPage: url,
        }}
      />
      <Link href="/blog" className="text-sm font-semibold text-accent underline underline-offset-4">All writing</Link>
      {isDraft ? <p role="status" className="mt-6 border border-accent/50 bg-accent/10 p-3 text-sm font-semibold">Draft preview. Visitors cannot see this post until you publish it.</p> : null}
      <p className="mt-8 text-sm font-semibold uppercase tracking-[0.2em] text-accent">
        <time dateTime={post.date}>{formatPostDate(post.date)}</time> · {minutes} min read
      </p>
      <h1 className="mt-5 font-display text-4xl font-semibold tracking-tight sm:text-6xl">{post.title}</h1>
      <p className="mt-6 text-xl leading-8 text-muted">{post.summary}</p>
      {post.tags.length > 0 ? (
        <ul aria-label="Tags" className="mt-6 flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <li key={tag}><Link href={`/blog?tag=${encodeURIComponent(tag)}`} className="rounded-full border border-ink/15 px-3 py-1 text-xs text-muted hover:border-accent hover:text-accent">{tag}</Link></li>
          ))}
        </ul>
      ) : null}
      <div className="mt-8"><ShareLinks url={url} title={post.title} /></div>
      <TableOfContents headings={headings} />
      <article className="prose prose-lg mt-12 max-w-none prose-headings:scroll-mt-24 prose-headings:font-display prose-headings:text-ink prose-p:text-muted prose-a:text-accent prose-strong:text-ink prose-pre:border prose-pre:border-ink/10 prose-code:before:content-none prose-code:after:content-none dark:prose-invert">
        <MarkdownContent>{post.content}</MarkdownContent>
      </article>
      <div className="mt-12 border-t border-ink/10 pt-8"><ShareLinks url={url} title={post.title} /></div>
      <PostNav newer={newer} older={older} />
    </main>
  );
}
