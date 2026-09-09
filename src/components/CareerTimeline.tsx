import type { TimelineItem } from "@/data/portfolio";

export function CareerTimeline({ items }: { items: TimelineItem[] }) {
  return (
    <section aria-labelledby="timeline-title" className="border-b border-ink/10 py-16 lg:py-24">
      <h2 id="timeline-title" className="font-display text-3xl font-semibold">A short timeline</h2>
      {items.length ? (
        <dl className="mt-10 space-y-8">
          {items.map((item) => (
            <div key={`${item.year}-${item.title}`} className="grid gap-3 border-l border-accent/40 pl-5 sm:grid-cols-[9rem_1fr] sm:gap-8">
              <dt className="text-sm font-semibold text-accent">{item.year}</dt>
              <dd>
                <h3 className="text-xl font-semibold">{item.title}</h3>
                <p className="mt-1 text-sm text-muted">{item.organization}</p>
                <p className="mt-3 max-w-2xl leading-7 text-muted">{item.summary}</p>
              </dd>
            </div>
          ))}
        </dl>
      ) : <p className="mt-8 text-muted">Timeline coming soon.</p>}
    </section>
  );
}
