import type { SkillRecord } from "@/lib/content/repository";

export function CompetencyGrid({ items }: { items: SkillRecord[] }) {
  return (
    <section aria-labelledby="competencies-title" className="border-b border-ink/10 py-16 lg:py-24">
      <h2 id="competencies-title" className="font-display text-3xl font-semibold">Core competencies</h2>
      {items.length ? (
        <div className="mt-10 grid gap-px overflow-hidden border border-ink/10 bg-ink/10 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => (
            <article key={item.id} className="bg-paper p-6">
              <h3 className="text-lg font-semibold">{item.name}</h3>
              <p className="mt-3 text-sm leading-7 text-muted">{item.description}</p>
            </article>
          ))}
        </div>
      ) : <p className="mt-8 text-muted">Competencies coming soon.</p>}
    </section>
  );
}
