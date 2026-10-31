import type { Highlight } from "@/lib/content/repository";

const initialsOf = (name: string) => name.trim().split(/\s+/).slice(0, 2).map((word) => word[0]).join("").toUpperCase();

export function Testimonials({ items }: { items: Highlight[] }) {
  if (items.length === 0) return null;

  return (
    <section id="testimonials" aria-labelledby="testimonials-title" className="border-b border-ink/10 py-16 lg:py-24">
      <h2 id="testimonials-title" className="font-display text-3xl font-semibold lg:text-4xl">Kind words</h2>
      <div className={`mt-10 grid gap-5 ${items.length > 1 ? "md:grid-cols-2" : "max-w-3xl"}`}>
        {items.map((item) => (
          <figure key={item.id} className="relative flex h-full flex-col overflow-hidden border border-accent/20 bg-ink/[0.035] p-6 backdrop-blur-xl sm:p-8">
            <svg aria-hidden="true" viewBox="0 0 48 36" className="absolute right-6 top-6 h-12 w-14 fill-accent opacity-20">
              <path d="M0 36V19C0 8 6 1.5 18 0l1.6 5.2C13.6 7 11 11 11 16h8v20H0Zm27 0V19C27 8 33 1.5 45 0l1.6 5.2C40.6 7 38 11 38 16h8v20H27Z" />
            </svg>
            <blockquote className="relative flex-1 text-lg leading-8 text-ink/90 sm:text-xl sm:leading-9">&ldquo;{item.body}&rdquo;</blockquote>
            <figcaption className="mt-8 flex items-center gap-4 border-t border-ink/10 pt-5 text-sm">
              <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent/15 font-semibold text-accent shadow-[0_0_20px_-4px_rgb(var(--color-accent)/0.6)]">{initialsOf(item.title)}</span>
              <span>
                <span className="block font-semibold">{item.url ? <a href={item.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 hover:text-accent">{item.title}</a> : item.title}</span>
                {item.subtitle ? <span className="block text-muted">{item.subtitle}</span> : null}
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
