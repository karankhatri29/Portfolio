import type { Heading } from "@/lib/content/blog-utils";

export function TableOfContents({ headings }: { headings: Heading[] }) {
  if (headings.length < 3) return null;

  return (
    <nav aria-label="Table of contents" className="mt-10 border border-ink/10 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">On this page</p>
      <ol className="mt-3 space-y-2 text-sm">
        {headings.map((heading) => (
          <li key={`${heading.id}-${heading.level}`} className={heading.level === 3 ? "pl-4" : ""}>
            <a href={`#${heading.id}`} className="text-muted underline-offset-4 hover:text-accent hover:underline">{heading.text}</a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
