import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";

import { JsonLd } from "@/components/JsonLd";
import { getBlogPost, listBlogPosts } from "@/lib/content/blog";
import { SITE_NAME, absoluteUrl } from "@/lib/site";

export async function generateStaticParams() {
  return (await listBlogPosts()).map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) return {};

  return {
    title: post.title,
    description: post.summary,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: { type: "article", title: post.title, description: post.summary, publishedTime: post.date || undefined, authors: [SITE_NAME] },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) notFound();

  return (
    <main className="mx-auto max-w-3xl px-5 py-20 lg:px-8 lg:py-32">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: post.title,
          description: post.summary,
          datePublished: post.date || undefined,
          author: { "@type": "Person", name: SITE_NAME },
          mainEntityOfPage: absoluteUrl(`/blog/${post.slug}`),
        }}
      />
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">{post.date}</p>
      <h1 className="mt-5 font-display text-5xl font-semibold tracking-tight sm:text-7xl">{post.title}</h1>
      <p className="mt-6 text-xl leading-8 text-muted">{post.summary}</p>
      <article className="prose prose-lg mt-12 max-w-none prose-headings:font-display prose-headings:text-ink prose-p:text-muted prose-a:text-accent prose-strong:text-ink dark:prose-invert">
        <ReactMarkdown>{post.content}</ReactMarkdown>
      </article>
    </main>
  );
}
