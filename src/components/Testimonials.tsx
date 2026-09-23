import type { Highlight } from "@/lib/content/repository";

export function Testimonials({ items }: { items: Highlight[] }) {
  if (items.length === 0) return null;

  return (
    <section id="testimonials" aria-labelledby="testimonials-title" className="border-b border-ink/10 py-16 lg:py-24">
      <h2 id="testimonials-title" className="font-display text-3xl font-semibold">Kind words</h2>
      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {items.map((item) => (
          <figure key={item.id} className="flex h-full flex-col border border-ink/10 p-6">
            <blockquote className="flex-1 leading-7 text-muted">&ldquo;{item.body}&rdquo;</blockquote>
            <figcaption className="mt-5 text-sm">
              <span className="font-semibold">{item.url ? <a href={item.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 hover:text-accent">{item.title}</a> : item.title}</span>
              {item.subtitle ? <span className="block text-muted">{item.subtitle}</span> : null}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
