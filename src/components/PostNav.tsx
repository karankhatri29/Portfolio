import Link from "next/link";

type NavPost = { slug: string; title: string };

export function PostNav({ newer, older }: { newer?: NavPost; older?: NavPost }) {
  if (!newer && !older) return null;

  return (
    <nav aria-label="More writing" className="mt-16 grid gap-4 border-t border-ink/10 pt-8 sm:grid-cols-2">
      {older ? (
        <Link href={`/blog/${older.slug}`} className="border border-ink/10 p-4 transition hover:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">
          <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-muted">Previous</span>
          <span className="mt-1 block font-display text-lg font-semibold">{older.title}</span>
        </Link>
      ) : <span />}
      {newer ? (
        <Link href={`/blog/${newer.slug}`} className="border border-ink/10 p-4 text-right transition hover:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:col-start-2">
          <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-muted">Next</span>
          <span className="mt-1 block font-display text-lg font-semibold">{newer.title}</span>
        </Link>
      ) : null}
    </nav>
  );
}
