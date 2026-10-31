import type { Heading } from "@/lib/content/blog-utils";

export function TableOfContents({ headings }: { headings: Heading[] }) {
  if (headings.length < 3) return null;

  return (
    <nav aria-label="Table of contents" className="mt-10 border border-accent/20 bg-ink/[0.035] p-5 backdrop-blur-xl">
      <p className="text-sm font-semibold text-muted">On this page</p>
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
