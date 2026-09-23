import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";

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
    <div role="group" aria-label="Terminal summary" className="overflow-hidden border border-ink/15 bg-paper/95 font-mono text-[13px] leading-6 shadow-2xl shadow-black/40 backdrop-blur">
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

export function HeroSection({ content, bookingUrl, projects, skills }: { content: PortfolioContent; bookingUrl?: string; projects?: Project[]; skills?: SkillRecord[] }) {
  const [role, ...rest] = content.headline.split(/(?<=\.)\s+/);
  const claim = rest.join(" ");

  return (
    <section aria-labelledby="hero-title" className="grid items-center gap-14 border-b border-ink/10 py-16 lg:grid-cols-[1.2fr_0.8fr] lg:gap-10 lg:py-28">
      <div>
        <p className="mb-5 text-sm font-semibold uppercase tracking-[0.2em] text-accent">{content.eyebrow}</p>
        <h1 id="hero-title" className="max-w-3xl font-display text-5xl font-semibold leading-[0.95] tracking-tight sm:text-7xl">{claim ? <><span className="block text-accent">{role}</span>{" "}<span className="block">{claim}</span></> : content.headline}</h1>
        <p className="mt-8 max-w-xl text-lg leading-8 text-muted">{content.summary}</p>
        {content.availability?.open ? (
          <p className="mt-6 inline-flex items-center gap-2 border border-accent/40 px-3 py-1 text-sm font-medium">
            <span aria-hidden="true" className="h-2 w-2 rounded-full bg-green-500" />
            {content.availability.label}
          </p>
        ) : null}
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <a href="#contact" className="bg-accent px-5 py-2.5 text-sm font-semibold text-paper transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper">Get in touch</a>
          <Link href="/resume" className="border border-ink/30 px-5 py-2.5 text-sm font-semibold transition hover:border-accent hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">View resume</Link>
          {bookingUrl ? <a href={bookingUrl} target="_blank" rel="noopener noreferrer" data-track="booking" className="border border-ink/30 px-5 py-2.5 text-sm font-semibold transition hover:border-accent hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">Book a call</a> : null}
        </div>
        <p className="mt-6 max-w-sm border-l border-accent/50 pl-6 text-sm leading-7 text-muted">Selected work, field notes, and practical ideas for making digital products feel more human.</p>
      </div>

      <div className="relative mx-auto w-full max-w-sm pr-3 lg:max-w-none lg:pb-12 lg:pr-4">
        <div className="relative">
          <div aria-hidden="true" className="absolute inset-0 translate-x-3 translate-y-3 border border-accent/40 lg:translate-x-4 lg:translate-y-4" />
          <figure className="relative aspect-[3/4] w-full overflow-hidden border border-ink/10 bg-ink/5">
            <Image
              src="/karan-khatri.png"
              alt={`${content.name} smiling, in a black suit and tie, standing on a lawn`}
              width={719}
              height={959}
              priority
              unoptimized
              className="h-full w-full object-cover object-[50%_20%]"
            />
            <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-paper/80 to-transparent" />
          </figure>
        </div>
        <div className="relative -mt-10 ml-4 mr-1 sm:ml-6 sm:mr-0 sm:w-80 lg:absolute lg:-left-6 lg:bottom-4 lg:m-0">
          <HeroTerminal context={terminalContext(content, projects, skills)}>
            <TerminalCard lines={content.terminal} />
          </HeroTerminal>
        </div>
      </div>
    </section>
  );
}
