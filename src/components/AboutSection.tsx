import type { AboutContent } from "@/data/portfolio";

export function AboutSection({ about }: { about: AboutContent }) {
  return (
    <section id="about" aria-labelledby="about-title" className="border-t border-ink/10 py-16 lg:py-24">
      <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">A little context</p>
          <h2 id="about-title" className="mt-4 font-display text-4xl font-semibold tracking-tight">About</h2>
        </div>
        <div>
          <p className="text-xl leading-9 text-ink">{about.introduction}</p>
          <p className="mt-6 leading-8 text-muted">{about.detail}</p>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2" aria-label="Working principles">
            {about.principles.map((principle) => <li key={principle} className="border-l border-accent/50 pl-4 text-sm leading-7 text-muted">{principle}</li>)}
          </ul>
          <div className="mt-12 grid gap-8 border-t border-ink/10 pt-8 sm:grid-cols-2">
            <div><h3 className="font-display text-xl font-semibold">Education</h3><ul className="mt-3 space-y-3 text-sm leading-7 text-muted">{about.education.map((item) => <li key={item}>{item}</li>)}</ul></div>
            <div><h3 className="font-display text-xl font-semibold">Recognition</h3><ul className="mt-3 space-y-3 text-sm leading-7 text-muted">{about.recognition.map((item) => <li key={item}>{item}</li>)}</ul></div>
          </div>
          <div className="mt-8 border-t border-ink/10 pt-8"><h3 className="font-display text-xl font-semibold">Leadership</h3><ul className="mt-3 grid gap-3 text-sm leading-7 text-muted sm:grid-cols-2">{about.leadership.map((item) => <li key={item}>{item}</li>)}</ul></div>
        </div>
      </div>
    </section>
  );
}
