import Link from "next/link";

import { CountUp } from "@/components/about/CountUp";
import type { AboutContent } from "@/data/portfolio";
import { degreeProgress } from "@/lib/about/degree";

const glass = "border border-accent/20 bg-ink/[0.035] backdrop-blur-xl";
const label = "text-sm font-semibold text-muted";
const list = "mt-4 space-y-3 text-sm leading-6 text-muted";

// A small glowing dot used as the list bullet in the credentials cards.
function Bullet() {
  return <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent shadow-[0_0_8px_1px_rgb(var(--color-accent)/0.7)]" />;
}

export function AboutSection({ about, now }: { about: AboutContent; now?: Date }) {
  const degree = degreeProgress(about.degree.start, about.degree.end, now ?? new Date());
  const percent = degree ? Math.round(degree.progress * 100) : 0;

  return (
    <section id="about" aria-labelledby="about-title" className="border-t border-ink/10 py-16 lg:py-24">
      <div className="grid gap-8 lg:grid-cols-[0.55fr_1.45fr] lg:gap-16">
        <div>
          <p className="text-sm font-medium text-accent">A little context</p>
          <h2 id="about-title" className="mt-3 font-display text-3xl font-semibold tracking-tight lg:text-4xl">About</h2>
        </div>
        <div>
          <p className="font-display text-2xl font-medium leading-snug tracking-tight sm:text-3xl">{about.introduction}</p>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-muted">{about.detail}</p>
        </div>
      </div>

      <ul aria-label="Highlights" className="mt-12 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {about.stats.map((stat) => (
          <li key={stat.label} className={`${glass} group relative p-5 transition duration-300 hover:-translate-y-1 hover:border-accent/60 hover:shadow-[0_0_44px_-12px_rgb(var(--color-accent)/0.5)] motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:p-6`}>
            <div aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent to-transparent opacity-60" />
            <p className="font-display text-4xl font-semibold leading-none text-accent sm:text-5xl"><CountUp value={stat.value} decimals={stat.decimals} suffix={stat.suffix} /></p>
            <p className="mt-4 text-sm font-semibold sm:text-base">{stat.label}</p>
            <p className="mt-1 text-xs leading-5 text-muted sm:text-sm">{stat.detail}</p>
          </li>
        ))}
      </ul>

      <div className="mt-16">
        <h3 className="font-display text-2xl font-semibold tracking-tight">How I work</h3>
        <ul aria-label="Working principles" className="mt-6 grid gap-4 sm:grid-cols-2">
          {about.principles.map((principle) => {
            const evidence = about.proof.find((item) => item.principle === principle);
            return (
              <li key={principle} className={`${glass} group relative flex flex-col justify-between gap-6 p-5 transition duration-300 hover:-translate-y-1 hover:border-accent/60 hover:shadow-[0_0_44px_-12px_rgb(var(--color-accent)/0.5)] motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:p-6`}>
                <p className="font-display text-xl font-semibold leading-snug">{principle}</p>
                {evidence ? (
                  <Link href={evidence.href} className="flex min-h-11 items-center justify-between gap-4 border-t border-ink/10 pt-4 text-sm after:absolute after:inset-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">
                    <span>
                      <span className="block text-xs font-semibold text-accent">Proof</span>
                      <span className="mt-1 block text-muted transition-colors group-hover:text-ink">{evidence.proof}</span>
                    </span>
                    <span aria-hidden="true" className="text-lg text-accent transition-transform group-hover:translate-x-1">&rarr;</span>
                  </Link>
                ) : null}
              </li>
            );
          })}
        </ul>
      </div>

      <div className={`${glass} mt-16 grid gap-8 p-6 sm:p-8 md:grid-cols-[1.7fr_1fr] md:gap-10`}>
        <div>
          <h3 className={label}>Education</h3>
          <p className="mt-3 font-display text-2xl font-semibold">{about.degree.institution}</p>
          <p className="mt-1 text-sm text-muted">{about.degree.program} · {about.degree.grade}</p>
          {degree ? (
            <div className="mt-6" role="img" aria-label={`${degree.label}, ${percent}% of the way through ${degree.startYear} to ${degree.endYear}`}>
              <div aria-hidden="true" className="relative h-1.5 rounded-full bg-ink/10">
                <div className="bar-in absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-accent/60 to-accent shadow-[0_0_16px_0_rgb(var(--color-accent)/0.6)]" style={{ width: `${percent}%` }} />
                <span className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-accent bg-paper shadow-[0_0_14px_2px_rgb(var(--color-accent)/0.7)]" style={{ left: `${percent}%` }} />
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

      <div id="credentials" className="mt-4 grid gap-4 md:grid-cols-3">
        {[
          { title: "Recognition", items: about.recognition },
          { title: "Certifications", items: about.certifications },
          { title: "Leadership", items: about.leadership },
        ].map((group) => (
          <div key={group.title} className={`${glass} p-6`}>
            <h3 className="font-display text-lg font-semibold">{group.title}</h3>
            <ul className={list}>
              {group.items.map((item) => <li key={item} className="flex gap-3"><Bullet /><span>{item}</span></li>)}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
