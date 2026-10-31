import type { Highlight } from "@/lib/content/repository";

export function Publications({ items }: { items: Highlight[] }) {
  if (items.length === 0) return null;

  return (
    <section id="publications" aria-labelledby="publications-title" className="border-b border-ink/10 py-16 lg:py-24">
      <h2 id="publications-title" className="font-display text-3xl font-semibold lg:text-4xl">Research and publications</h2>
      <ul className="mt-10 grid gap-5">
        {items.map((item) => (
          <li key={item.id} className="group relative border border-accent/20 bg-ink/[0.035] p-6 backdrop-blur-xl transition duration-300 hover:border-accent/60 hover:shadow-[0_0_44px_-12px_rgb(var(--color-accent)/0.5)] motion-reduce:transition-none sm:p-8">
            <div aria-hidden="true" className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-accent to-transparent opacity-70" />
            {item.subtitle ? <p className="inline-block rounded-full border border-accent/40 px-3 py-1 text-xs font-medium text-accent">{item.subtitle}</p> : null}
            <h3 className="mt-4 max-w-3xl font-display text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">
              {item.url ? <a href={item.url} target="_blank" rel="noopener noreferrer" className="after:absolute after:inset-0 hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">{item.title}</a> : item.title}
            </h3>
            {item.body ? <p className="mt-4 max-w-3xl text-lg leading-8 text-muted">{item.body}</p> : null}
            {item.url ? <p aria-hidden="true" className="mt-6 text-sm font-semibold text-accent">Read the paper <span className="inline-block transition-transform group-hover:translate-x-1">&rarr;</span></p> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
