import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";

import { NeuralField } from "@/components/NeuralField";
import { HeroTerminal } from "@/components/terminal/HeroTerminal";
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
    skills: (skills ?? []).map((skill) => ({ name: skill.name, tools: skill.tools ?? [] })),
    projects: projects
      ? projects.map((project) => ({ title: project.title, year: project.year, href: `/projects/${project.slug}` }))
      : content.timeline.map((item) => ({ title: item.organization, year: item.year })),
    contacts: content.contactLinks
      .map((link) => ({ label: contactLabel[link.icon] ?? link.label, text: link.href.replace(/^mailto:/, "").replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, ""), href: link.href })),
  };
}

const typed = (text: string, delay: number): CSSProperties => ({ "--n": text.length, "--delay": `${delay}ms` }) as CSSProperties;

function TerminalCard({ lines }: { lines: TerminalLine[] }) {
  const rows = scheduleTerminal(lines);

  return (
    <div role="group" aria-label="Terminal summary" className="group relative overflow-hidden border border-accent/30 bg-paper/50 font-mono text-[13px] leading-6 shadow-[0_0_44px_-12px_rgb(var(--color-accent)/0.5)] backdrop-blur-xl transition duration-300 hover:border-accent/60 hover:shadow-[0_0_52px_-8px_rgb(var(--color-accent)/0.65)]">
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent to-transparent" />
      <div aria-hidden="true" className="flex items-center gap-2 border-b border-ink/10 px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-ink/25" />
        <span className="h-2.5 w-2.5 rounded-full bg-ink/25" />
        <span className="h-2.5 w-2.5 rounded-full bg-ink/25" />
        <span className="ml-2 text-xs text-muted">~/portfolio</span>
      </div>
      <div className="space-y-0.5 px-4 py-4">
        {rows.map(({ command, output }) => (
          <div key={command.text}>
            <p className="flex text-ink"><span aria-hidden="true" className="pr-2 text-accent">$</span><span className="term-line" style={typed(command.text, command.delay)}>{command.text}</span></p>
            <p className="term-line text-muted" style={typed(output.text, output.delay)}>{output.text}</p>
          </div>
        ))}
        <p aria-hidden="true" className="flex text-ink"><span className="pr-2 text-accent">$</span><span className="term-cursor inline-block h-4 w-2 translate-y-1 bg-accent" /></p>
      </div>
    </div>
  );
}


const roleSize = "whitespace-nowrap text-[clamp(3.4rem,15vw,11rem)]";

export function HeroSection({ content, bookingUrl, projects, skills }: { content: PortfolioContent; bookingUrl?: string; projects?: Project[]; skills?: SkillRecord[] }) {
  const [role, ...rest] = content.headline.split(/(?<=\.)\s+/);
  const claim = rest.join(" ");

  return (
    <section aria-labelledby="hero-title" data-field-host className="relative isolate border-b border-ink/10 pt-8 lg:pt-12">
      <NeuralField className="pointer-events-none absolute inset-y-0 left-1/2 -z-10 h-full w-screen -translate-x-1/2" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-1/4 bg-gradient-to-t from-paper to-transparent" />

      <div className="relative">
        <div className="relative h-[32rem] sm:h-[38rem] lg:h-[46rem]">
          <div className="absolute inset-x-0 top-0 z-30 flex flex-wrap items-start justify-between gap-3">
            <p className="text-sm font-medium text-muted">{content.eyebrow}</p>
            {content.availability?.open ? (
              <p className="inline-flex items-center gap-2.5 rounded-full border border-accent/30 bg-accent/10 py-1.5 pl-3.5 pr-4 text-sm font-medium text-ink backdrop-blur">
                <span aria-hidden="true" className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-accent opacity-60 motion-safe:animate-ping" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-accent" />
                </span>
                {content.availability.label}
              </p>
            ) : null}
          </div>

          {/* The role is set huge behind the portrait; the claim is shown in the dock below and kept here for assistive tech. */}
          <h1 id="hero-title" className="absolute inset-x-0 top-[14%] z-10 text-center font-display font-bold leading-none tracking-tighter sm:top-[11%] lg:top-[9%]">
            {claim ? (
              <>
                <span className={`block bg-gradient-to-b from-ink from-45% to-accent bg-clip-text text-transparent ${roleSize}`}>{role}</span>
                <span className="sr-only"> {claim}</span>
              </>
            ) : <span className="block text-4xl sm:text-6xl">{content.headline}</span>}
          </h1>

          <div aria-hidden="true" className="absolute bottom-0 left-1/2 z-[12] h-[62%] w-[min(34rem,92%)] -translate-x-1/2 rounded-full bg-accent/25 blur-3xl" />

          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex h-[70%] justify-center lg:h-[68%] lg:-translate-x-[7%]">
            <Image
              src="/karan-khatri-cutout.webp"
              alt={`${content.name} smiling, in a black suit and tie`}
              width={458}
              height={619}
              priority
              unoptimized
              className="h-full w-auto object-contain object-bottom [mask-image:linear-gradient(to_bottom,#000_80%,transparent)]"
            />
          </div>

        </div>

        <div className="relative z-30 -mt-2 grid gap-8 pb-10 md:grid-cols-2 md:items-start md:gap-10 lg:absolute lg:inset-x-0 lg:bottom-0 lg:mt-0 lg:items-end lg:gap-6 lg:pb-8">
          <div className="lg:col-start-2 lg:ml-auto lg:max-w-[22rem]">
            {claim ? <p aria-hidden="true" className="font-display text-2xl font-semibold leading-tight tracking-tight sm:text-3xl lg:text-[1.7rem]">{claim}</p> : null}
            <p className="mt-4 text-base leading-7 text-muted">{content.summary}</p>
            <div className="mt-6 grid gap-3 sm:flex sm:flex-wrap sm:items-center">
              <a href="#contact" className="flex min-h-12 items-center justify-center bg-accent px-6 text-base font-semibold text-paper transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_28px_-6px_rgb(var(--color-accent)/0.6)] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper">Get in touch</a>
              <Link href="/resume" className="flex min-h-12 items-center justify-center border border-ink/30 bg-paper/40 px-6 text-base font-semibold backdrop-blur transition duration-200 hover:-translate-y-0.5 hover:border-accent hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">View resume</Link>
              {bookingUrl ? <a href={bookingUrl} target="_blank" rel="noopener noreferrer" data-track="booking" className="flex min-h-12 items-center justify-center border border-ink/30 bg-paper/40 px-6 text-base font-semibold backdrop-blur transition duration-200 hover:-translate-y-0.5 hover:border-accent hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">Book a call</a> : null}
            </div>
            <p className="mt-6 max-w-sm border-l border-accent/50 pl-6 text-sm leading-7 text-muted">Selected work, field notes, and practical ideas for making digital products feel more human.</p>
          </div>
          <div className="w-full max-w-sm md:max-w-none lg:col-start-1 lg:row-start-1 lg:max-w-[21rem]">
            <HeroTerminal context={terminalContext(content, projects, skills)}>
              <TerminalCard lines={content.terminal} />
            </HeroTerminal>
          </div>
        </div>
      </div>
    </section>
  );
}
