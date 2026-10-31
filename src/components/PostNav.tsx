import Link from "next/link";

type NavPost = { slug: string; title: string };

export function PostNav({ newer, older }: { newer?: NavPost; older?: NavPost }) {
  if (!newer && !older) return null;

  return (
    <nav aria-label="More writing" className="mt-16 grid gap-4 border-t border-ink/10 pt-8 sm:grid-cols-2">
      {older ? (
        <Link href={`/blog/${older.slug}`} className="border border-accent/20 bg-ink/[0.035] p-5 backdrop-blur-xl transition duration-300 hover:-translate-y-0.5 hover:border-accent/60 hover:shadow-[0_0_36px_-10px_rgb(var(--color-accent)/0.5)] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent motion-reduce:transition-none motion-reduce:hover:translate-y-0">
          <span className="block text-sm text-muted"><span aria-hidden="true">&larr; </span>Previous</span>
          <span className="mt-1 block font-display text-lg font-semibold">{older.title}</span>
        </Link>
      ) : <span />}
      {newer ? (
        <Link href={`/blog/${newer.slug}`} className="border border-accent/20 bg-ink/[0.035] p-5 backdrop-blur-xl transition duration-300 hover:-translate-y-0.5 hover:border-accent/60 hover:shadow-[0_0_36px_-10px_rgb(var(--color-accent)/0.5)] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent motion-reduce:transition-none motion-reduce:hover:translate-y-0 text-right sm:col-start-2">
          <span className="block text-sm text-muted">Next<span aria-hidden="true"> &rarr;</span></span>
          <span className="mt-1 block font-display text-lg font-semibold">{newer.title}</span>
        </Link>
      ) : null}
    </nav>
  );
}
