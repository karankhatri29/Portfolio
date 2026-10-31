import Image from "next/image";
import Link from "next/link";
import { Fragment } from "react";
import type { CSSProperties } from "react";

import { NeuralField } from "@/components/NeuralField";
import { HeroTerminal } from "@/components/terminal/HeroTerminal";
import { TeaserLine } from "@/components/terminal/TeaserLine";
import type { PortfolioContent, TerminalLine } from "@/data/portfolio";
import type { TerminalContext } from "@/lib/ask/commands";
import type { Project, SkillRecord } from "@/lib/content/repository";

const TYPE_MS_PER_CHAR = 32;
const PAUSE_MS = 280;
const START_MS = 700;

// Each line types in one after another; timing is computed here so the effect is pure CSS.
function scheduleTerminal(lines: TerminalLine[]) {
  let clock = START_MS;
  const rows = lines.map((line) => {
    const command = { text: line.command, delay: clock };
    clock += line.command.length * TYPE_MS_PER_CHAR + PAUSE_MS;
    const output = { text: line.output, delay: clock };
    clock += line.output.length * TYPE_MS_PER_CHAR + PAUSE_MS;
    return { command, output };
  });
  return rows;
}

const contactLabel: Record<string, string> = { email: "Email", github: "GitHub", linkedin: "LinkedIn" };

// What the interactive terminal's built-in commands print, taken from the same data the page renders.
function terminalContext(content: PortfolioContent, projects?: Project[], skills?: SkillRecord[]): TerminalContext {
  return {
    name: content.name,
    focus: content.terminal,
    about: { introduction: content.about.introduction, detail: content.about.detail },
    availability: content.availability?.open ? content.availability.label : undefined,
    skills: (skills ?? []).map((skill) => ({ name: skill.name, tools: skill.tools ?? [], description: skill.description })),
    projects: projects?.length
      ? projects.map((project) => ({ title: project.title, year: project.year, href: `/projects/${project.slug}`, role: project.role, summary: project.summary }))
      : content.timeline.map((item) => ({ title: item.organization, year: item.year, role: item.title, summary: item.summary })),
    contacts: content.contactLinks
      .map((link) => ({ label: contactLabel[link.icon] ?? link.label, text: link.href.replace(/^mailto:/, "").replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, ""), href: link.href })),
  };
}

const typed = (text: string, delay: number): CSSProperties => ({ "--n": text.length, "--delay": `${delay}ms` }) as CSSProperties;

const PROMPT = "karan@k3:~$";

function TerminalCard({ lines, teasers }: { lines: TerminalLine[]; teasers?: string[] }) {
  const rows = scheduleTerminal(lines);

  return (
    <div role="group" aria-label="Terminal summary" className="term-breathe group relative overflow-hidden border border-accent/30 bg-paper/60 font-mono text-sm leading-6 shadow-[0_0_44px_-12px_rgb(var(--color-accent)/0.5)] backdrop-blur-xl transition duration-300 hover:border-accent/70 hover:shadow-[0_0_56px_-8px_rgb(var(--color-accent)/0.7)]">
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent to-transparent" />
      <div aria-hidden="true" className="flex items-center gap-2 border-b border-ink/10 px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-ink/25" />
        <span className="h-2.5 w-2.5 rounded-full bg-ink/25" />
        <span className="h-2.5 w-2.5 rounded-full bg-ink/25" />
        <span className="ml-2 text-xs text-muted">karan@k3: ~/portfolio</span>
      </div>
      <div className="space-y-0.5 px-4 py-4">
        {rows.map(({ command, output }) => (
          <div key={command.text}>
            <p className="flex text-ink"><span aria-hidden="true" className="pr-2 text-accent">{PROMPT}</span><span className="term-line" style={typed(command.text, command.delay)}>{command.text}</span></p>
            <p className="term-line text-muted" style={typed(output.text, output.delay)}>{output.text}</p>
          </div>
        ))}
        {teasers?.length ? <TeaserLine commands={teasers} prompt={PROMPT} /> : (
          <p aria-hidden="true" className="flex text-ink"><span className="pr-2 text-accent">{PROMPT}</span><span className="term-cursor inline-block h-4 w-2 translate-y-1 bg-accent" /></p>
        )}
      </div>
    </div>
  );
}

const nameSize = "text-[clamp(3rem,13.5vw,4.25rem)] md:text-[clamp(3rem,min(7.4vw,12.5vh),6.25rem)]";

const NAME_START_MS = 250;
const NAME_LINE_STAGGER_MS = 330;

// Colour at a point down the name (0 = first line, 1 = last): plain ink for the first stretch, easing toward the accent.
const mixAt = (position: number) => `color-mix(in srgb, rgb(var(--color-accent)) ${Math.round(Math.max(0, (position - 0.35) / 0.65) * 100)}%, rgb(var(--color-ink)))`;

// Each name line sweeps in a little after the one above it. Timing is worked out here so the effect is pure CSS.
function scheduleName(words: string[]) {
  return words.map((word, index) => ({ word, delay: NAME_START_MS + index * NAME_LINE_STAGGER_MS, from: index / words.length, to: (index + 1) / words.length }));
}

// "Integrated M.Tech CSE student / builder" read as a path: connected stops that lead to the role.
function PathTrail({ steps }: { steps: string[] }) {
  return (
    <ol aria-label="Path" className="flex flex-wrap items-center gap-y-2 text-sm font-medium">
      {steps.map((step, index) => {
        const last = index === steps.length - 1;
        return (
          <li key={step} className="flex items-center">
            <span className={`flex items-center gap-2.5 ${last ? "text-accent" : "text-muted"}`}>
              <span aria-hidden="true" className={`h-2.5 w-2.5 rounded-full border ${last ? "border-accent bg-accent shadow-[0_0_12px_2px_rgb(var(--color-accent)/0.7)]" : "border-accent/60 bg-paper"}`} />
              {step}
            </span>
            {last ? null : <span aria-hidden="true" className="mx-3 h-px w-6 bg-gradient-to-r from-accent/20 to-accent/70 sm:w-10" />}
          </li>
        );
      })}
    </ol>
  );
}

const cta = "group inline-flex min-h-12 items-center justify-center gap-2 rounded-full border px-6 text-base font-semibold transition duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper";
const arrow = <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">&rarr;</span>;

export function HeroSection({ content, bookingUrl, projects, skills }: { content: PortfolioContent; bookingUrl?: string; projects?: Project[]; skills?: SkillRecord[] }) {
  const [role, ...rest] = content.headline.split(/(?<=\.)\s+/);
  const claim = rest.join(" ");
  const steps = [...content.eyebrow.split(/\s*\/\s*/), role.replace(/\.$/, "")].filter(Boolean);
  const lines = scheduleName(content.name.split(" "));

  return (
    <section aria-labelledby="hero-title" data-field-host className="relative isolate border-b border-ink/10 pb-14 pt-6 lg:pb-16 lg:pt-8">
      <NeuralField className="pointer-events-none absolute inset-y-0 left-1/2 -z-10 h-full w-screen -translate-x-1/2" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-1/4 bg-gradient-to-t from-paper to-transparent" />

      {/*
        One rule for the layout. On phones everything stacks: name, photo, text, terminal.
        From md up the hero is exactly one screen tall (never shorter than its content needs, never taller than 54rem) and has two columns.
        The right column is a flex column: the terminal takes the height it needs at the bottom and the portrait fills whatever is left,
        so the two can never overlap and the terminal is always in the first screen. The left column puts the name at the top and the text at the bottom.
      */}
      <div className="grid gap-y-8 md:h-[clamp(40rem,calc(100svh-9.5rem),54rem)] md:grid-cols-[1.15fr_1fr] md:grid-rows-[minmax(0,1fr)] md:gap-x-8 lg:gap-x-12">
        <div className="contents md:flex md:min-h-0 md:flex-col md:justify-between md:gap-8">
          <h1 id="hero-title" aria-label={content.name} className={`order-1 font-display font-bold uppercase leading-[0.95] tracking-tight ${nameSize}`}>
            {lines.map((line, index) => (
              <Fragment key={`${line.word}-${index}`}>
                {index ? " " : null}
                <span
                  aria-hidden="true"
                  className="name-in block w-fit bg-clip-text pb-[0.04em] text-transparent"
                  style={{ "--delay": `${line.delay}ms`, backgroundImage: `linear-gradient(to bottom, ${mixAt(line.from)}, ${mixAt(line.to)})` } as CSSProperties}
                >{line.word}</span>
              </Fragment>
            ))}
          </h1>

          <div className="order-3 flex flex-col gap-8">
            <div>
              {claim ? <p className="max-w-xl font-sans text-2xl font-semibold leading-[1.15] tracking-[-0.03em] sm:text-[1.9rem]">{claim}</p> : null}
              <p className="mt-4 max-w-lg font-sans text-base leading-7 tracking-[-0.01em] text-ink/70 md:text-lg md:leading-8">{content.tagline ?? content.summary}</p>
              <div className="mt-6 grid gap-3 sm:flex sm:flex-wrap sm:items-center">
                <a href="#contact" className={`${cta} border-accent bg-transparent text-accent hover:bg-accent hover:text-paper hover:shadow-[0_8px_30px_-6px_rgb(var(--color-accent)/0.65)]`}>Get in touch {arrow}</a>
                <Link href="/resume" className={`${cta} border-ink/35 bg-transparent text-ink hover:border-ink hover:bg-ink hover:text-paper`}>View resume {arrow}</Link>
                {bookingUrl ? <a href={bookingUrl} target="_blank" rel="noopener noreferrer" data-track="booking" className={`${cta} border-ink/35 bg-transparent text-ink hover:border-ink hover:bg-ink hover:text-paper`}>Book a call {arrow}</a> : null}
              </div>
            </div>

            <div className="flex flex-col items-start gap-4">
              <PathTrail steps={steps} />
              {content.availability?.open ? (
                <p className="inline-flex w-fit items-center gap-2.5 rounded-full border border-accent/30 bg-accent/10 py-1.5 pl-3.5 pr-4 text-sm font-medium text-ink backdrop-blur">
                  <span aria-hidden="true" className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-accent opacity-60 motion-safe:animate-ping" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-accent" />
                  </span>
                  {content.availability.label}
                </p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="contents md:flex md:min-h-0 md:flex-col md:items-center md:gap-5">
          <div className="pointer-events-none relative order-2 flex items-end justify-center md:min-h-0 md:w-full md:flex-1">
            <div aria-hidden="true" className="absolute bottom-0 left-1/2 h-[75%] w-[min(30rem,100%)] -translate-x-1/2 rounded-full bg-accent/25 blur-3xl" />
            <Image
              src="/karan-khatri-cutout.webp"
              alt={`${content.name} smiling, in a black suit and tie`}
              width={458}
              height={619}
              priority
              unoptimized
              className="relative h-[22rem] w-auto object-contain object-bottom [mask-image:linear-gradient(to_bottom,#000_75%,transparent)] sm:h-[26rem] md:h-full md:max-h-full"
            />
          </div>

          <div className="relative z-10 order-4 w-full max-w-sm md:max-w-[22rem] md:shrink-0">
            <HeroTerminal context={terminalContext(content, projects, skills)}>
              <TerminalCard lines={content.terminal} teasers={content.terminalTeasers} />
            </HeroTerminal>
          </div>
        </div>
      </div>
    </section>
  );
}
