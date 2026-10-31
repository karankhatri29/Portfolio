import Link from "next/link";

type RelatedPost = { slug: string; title: string; summary: string; tags: string[] };

/** Posts that share the most tags with the current one, for internal linking. */
export function relatedPosts<T extends RelatedPost>(current: { slug: string; tags: string[] }, all: T[], limit = 3): T[] {
  return all
    .filter((post) => post.slug !== current.slug)
    .map((post) => ({ post, shared: post.tags.filter((tag) => current.tags.includes(tag)).length }))
    .filter((entry) => entry.shared > 0)
    .sort((a, b) => b.shared - a.shared)
    .slice(0, limit)
    .map((entry) => entry.post);
}

export function RelatedPosts({ posts }: { posts: RelatedPost[] }) {
  if (posts.length === 0) return null;

  return (
    <section aria-labelledby="related-title" className="mt-16 border-t border-ink/10 pt-8">
      <h2 id="related-title" className="font-display text-2xl font-semibold tracking-tight">Related reading</h2>
      <ul className="mt-6 grid gap-4 sm:grid-cols-3">
        {posts.map((post) => (
          <li key={post.slug}>
            <Link href={`/blog/${post.slug}`} className="block h-full border border-accent/20 bg-ink/[0.035] p-5 backdrop-blur-xl transition duration-300 hover:-translate-y-0.5 hover:border-accent/60 hover:shadow-[0_0_36px_-10px_rgb(var(--color-accent)/0.5)] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent motion-reduce:transition-none motion-reduce:hover:translate-y-0">
              <span className="block font-display text-lg font-semibold">{post.title}</span>
              <span className="mt-2 block text-sm leading-6 text-muted">{post.summary}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
