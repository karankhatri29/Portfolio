import type { PortfolioContent } from "@/data/portfolio";

export function HeroSection({ content }: { content: PortfolioContent }) {
  return (
    <section aria-labelledby="hero-title" className="grid gap-10 border-b border-ink/10 py-20 lg:grid-cols-[1.2fr_0.8fr] lg:py-32">
      <div>
        <p className="mb-5 text-sm font-semibold uppercase tracking-[0.2em] text-accent">{content.eyebrow}</p>
        <h1 id="hero-title" className="max-w-3xl font-display text-5xl font-semibold leading-[0.95] tracking-tight sm:text-7xl">{content.headline}</h1>
        <p className="mt-8 max-w-xl text-lg leading-8 text-muted">{content.summary}</p>
      </div>
      <p className="self-end max-w-sm border-l border-accent/50 pl-6 text-sm leading-7 text-muted">Selected work, field notes, and practical ideas for making digital products feel more human.</p>
    </section>
  );
}
