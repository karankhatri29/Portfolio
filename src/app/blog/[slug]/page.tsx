import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";

import { getBlogPost, listBlogPosts } from "@/lib/content/blog";

export function generateStaticParams() {
  return listBlogPosts().map((post) => ({ slug: post.slug }));
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();

  return (
    <main className="mx-auto max-w-3xl px-5 py-20 lg:px-8 lg:py-32">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">{post.date}</p>
      <h1 className="mt-5 font-display text-5xl font-semibold tracking-tight sm:text-7xl">{post.title}</h1>
      <p className="mt-6 text-xl leading-8 text-muted">{post.summary}</p>
      <article className="prose prose-lg mt-12 max-w-none prose-headings:font-display prose-headings:text-ink prose-p:text-muted prose-a:text-accent prose-strong:text-ink dark:prose-invert">
        <ReactMarkdown>{post.content}</ReactMarkdown>
      </article>
    </main>
  );
}
