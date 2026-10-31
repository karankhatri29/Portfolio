import Link from "next/link";

export type WritingPreviewPost = { slug: string; title: string; date: string; summary: string };

const glass = "group relative flex flex-col border border-accent/20 bg-ink/[0.035] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-accent/60 hover:shadow-[0_0_44px_-12px_rgb(var(--color-accent)/0.5)] motion-reduce:transition-none motion-reduce:hover:translate-y-0";

// The whole card is clickable through the title link, so there is one link per post for keyboard and screen-reader users.
function PostCard({ post, featured }: { post: WritingPreviewPost; featured?: boolean }) {
  return (
    <article className={`${glass} ${featured ? "p-7 sm:p-9 lg:min-h-[22rem]" : "p-6 sm:p-7"}`}>
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent to-transparent opacity-60" />
      <p className="text-sm text-muted">
        {featured ? <span className="mr-3 rounded-full border border-accent/40 px-2.5 py-0.5 text-xs font-medium text-accent">Latest</span> : null}
        {post.date}
      </p>
      <h3 className={`mt-4 font-display font-semibold leading-tight tracking-tight ${featured ? "text-3xl sm:text-4xl" : "text-2xl"}`}>
        <Link href={`/blog/${post.slug}`} className="after:absolute after:inset-0 hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">{post.title}</Link>
      </h3>
      <p className={`mt-4 flex-1 text-muted ${featured ? "text-lg leading-8" : "leading-7"}`}>{post.summary}</p>
      <p aria-hidden="true" className="mt-6 text-sm font-semibold text-accent">Read the post <span className="inline-block transition-transform group-hover:translate-x-1">&rarr;</span></p>
    </article>
  );
}

export function WritingPreview({ posts }: { posts: WritingPreviewPost[] }) {
  const [latest, second] = posts;

  return (
    <section id="writing" aria-labelledby="writing-title" className="border-t border-ink/10 py-16 lg:py-24">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-sm font-medium text-accent">Notes from the work</p>
          <h2 id="writing-title" className="mt-3 font-display text-3xl font-semibold tracking-tight lg:text-4xl">Writing and research</h2>
        </div>
        <Link href="/blog" className="inline-flex min-h-11 items-center border-b border-accent text-sm font-semibold text-accent transition hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">Read all writing</Link>
      </div>
      <div className={`mt-10 grid gap-5 ${second ? "lg:grid-cols-[1.35fr_1fr]" : ""}`}>
        {latest ? (
          <>
            <PostCard post={latest} featured />
            {second ? <PostCard post={second} /> : null}
          </>
        ) : <p className="text-muted">New writing is on the way.</p>}
      </div>
    </section>
  );
}
