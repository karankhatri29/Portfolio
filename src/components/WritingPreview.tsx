import Link from "next/link";

export type WritingPreviewPost = { slug: string; title: string; date: string; summary: string };

export function WritingPreview({ posts }: { posts: WritingPreviewPost[] }) {
  return (
    <section id="writing" aria-labelledby="writing-title" className="border-t border-ink/10 py-16 lg:py-24">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">Notes from the work</p>
          <h2 id="writing-title" className="mt-4 font-display text-4xl font-semibold tracking-tight">Writing and research</h2>
        </div>
        <Link href="/blog" className="border-b border-accent pb-1 text-sm font-semibold text-accent focus:outline-none focus:ring-2 focus:ring-accent">Read all writing</Link>
      </div>
      <div className="mt-10 grid gap-5 md:grid-cols-2">
        {posts.length ? posts.slice(0, 2).map((post) => (
          <article key={post.slug} className="border border-ink/10 p-6">
            <p className="text-sm text-muted">{post.date}</p>
            <h3 className="mt-3 font-display text-2xl font-semibold"><Link href={`/blog/${post.slug}`} className="hover:text-accent">{post.title}</Link></h3>
            <p className="mt-3 leading-7 text-muted">{post.summary}</p>
          </article>
        )) : <p className="text-muted">New writing is on the way.</p>}
      </div>
    </section>
  );
}
