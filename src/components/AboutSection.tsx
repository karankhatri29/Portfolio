import Link from "next/link";

import { CountUp } from "@/components/about/CountUp";
import type { AboutContent } from "@/data/portfolio";
import { degreeProgress } from "@/lib/about/degree";

const label = "text-xs font-semibold uppercase tracking-[0.18em] text-muted";
const list = "mt-3 space-y-2 text-sm leading-7 text-muted";

export function AboutSection({ about, now }: { about: AboutContent; now?: Date }) {
  const degree = degreeProgress(about.degree.start, about.degree.end, now ?? new Date());
  const percent = degree ? Math.round(degree.progress * 100) : 0;

  return (
    <section id="about" aria-labelledby="about-title" className="border-t border-ink/10 py-16 lg:py-20">
      <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">A little context</p>
          <h2 id="about-title" className="mt-4 font-display text-4xl font-semibold tracking-tight">About</h2>
        </div>
        <div>
          <p className="text-xl leading-9 text-ink">{about.introduction}</p>
          <p className="mt-6 leading-8 text-muted">{about.detail}</p>
        </div>
      </div>

      <ul aria-label="Highlights" className="mt-10 grid grid-cols-2 gap-px overflow-hidden border border-ink/10 bg-ink/10 lg:grid-cols-4">
        {about.stats.map((stat) => (
          <li key={stat.label} className="bg-paper p-5 sm:p-6">
            <p className="font-display text-4xl font-semibold leading-none text-accent sm:text-5xl"><CountUp value={stat.value} decimals={stat.decimals} suffix={stat.suffix} /></p>
            <p className="mt-3 text-sm font-semibold">{stat.label}</p>
            <p className="mt-1 text-xs leading-5 text-muted">{stat.detail}</p>
          </li>
        ))}
      </ul>

      <div className="mt-12">
        <h3 className={label}>How I work</h3>
        <ul aria-label="Working principles" className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {about.principles.map((principle) => {
            const evidence = about.proof.find((item) => item.principle === principle);
            return (
              <li key={principle} className="flex flex-col border border-ink/10 p-5 transition-colors focus-within:border-accent/60 hover:border-accent/60">
                <p className="flex-1 font-display text-lg font-semibold leading-snug">{principle}</p>
                {evidence ? (
                  <Link href={evidence.href} className="group mt-4 flex items-end justify-between gap-3 border-t border-ink/10 pt-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">
                    <span>
                      <span className="block text-xs uppercase tracking-[0.16em] text-accent">Proof</span>
                      <span className="mt-1 block text-muted transition-colors group-hover:text-ink">{evidence.proof}</span>
                    </span>
                    <span aria-hidden="true" className="text-accent transition-transform group-hover:translate-x-1">→</span>
                  </Link>
                ) : null}
              </li>
            );
          })}
        </ul>
      </div>

      <div className="mt-10 grid gap-8 border border-ink/10 p-6 sm:p-8 md:grid-cols-[1.7fr_1fr] md:gap-10">
        <div>
          <h3 className={label}>Education</h3>
          <p className="mt-3 font-display text-2xl font-semibold">{about.degree.institution}</p>
          <p className="mt-1 text-sm text-muted">{about.degree.program} · {about.degree.grade}</p>
          {degree ? (
            <div className="mt-6" role="img" aria-label={`${degree.label}, ${percent}% of the way through ${degree.startYear} to ${degree.endYear}`}>
              <div aria-hidden="true" className="relative h-1.5 rounded-full bg-ink/10">
                <div className="bar-in absolute inset-y-0 left-0 rounded-full bg-accent" style={{ width: `${percent}%` }} />
                <span className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-accent bg-paper" style={{ left: `${percent}%` }} />
              </div>
              <div aria-hidden="true" className="mt-3 flex items-center justify-between text-xs text-muted">
                <span>{degree.startYear}</span>
                <span className="font-semibold text-accent">{degree.label}</span>
                <span>{degree.endYear}</span>
              </div>
            </div>
          ) : null}
        </div>
        {about.education.length ? (
          <div className="border-t border-ink/10 pt-6 md:border-l md:border-t-0 md:pl-10 md:pt-0">
            <h3 className={label}>Before that</h3>
            <ul className={list}>{about.education.map((item) => <li key={item}>{item}</li>)}</ul>
          </div>
        ) : null}
      </div>

      <div id="credentials" className="mt-10 grid gap-8 border-t border-ink/10 pt-8 md:grid-cols-3">
        <div><h3 className={label}>Recognition</h3><ul className={list}>{about.recognition.map((item) => <li key={item}>{item}</li>)}</ul></div>
        <div><h3 className={label}>Certifications</h3><ul className={list}>{about.certifications.map((item) => <li key={item}>{item}</li>)}</ul></div>
        <div><h3 className={label}>Leadership</h3><ul className={list}>{about.leadership.map((item) => <li key={item}>{item}</li>)}</ul></div>
      </div>
    </section>
  );
}
