import type { Highlight } from "@/lib/content/repository";

export function Publications({ items }: { items: Highlight[] }) {
  if (items.length === 0) return null;

  return (
    <section id="publications" aria-labelledby="publications-title" className="border-b border-ink/10 py-16 lg:py-24">
      <h2 id="publications-title" className="font-display text-3xl font-semibold">Research and publications</h2>
      <ul className="mt-10 space-y-8">
        {items.map((item) => (
          <li key={item.id}>
            <h3 className="font-display text-xl font-semibold">{item.url ? <a href={item.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 hover:text-accent">{item.title}</a> : item.title}</h3>
            {item.subtitle ? <p className="mt-1 text-sm font-semibold text-accent">{item.subtitle}</p> : null}
            {item.body ? <p className="mt-3 max-w-3xl leading-7 text-muted">{item.body}</p> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
