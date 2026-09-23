import type { Metadata } from "next";
import Link from "next/link";

import { PrintButton } from "@/components/PrintButton";
import { portfolioContent } from "@/data/portfolio";
import { listProjects, listSkills } from "@/lib/content/repository";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Resume",
  description: `Resume of ${portfolioContent.name}: experience, projects, skills, education and leadership.`,
  alternates: { canonical: "/resume" },
};

function contactLine() {
  const parts = portfolioContent.contactLinks.map((link) => (link.href.startsWith("mailto:") ? link.href.slice(7) : link.href.replace(/^https?:\/\/(www\.)?/, "")));
  return [...parts, siteUrl().replace(/^https?:\/\//, "")];
}

const heading = "font-display text-xl font-semibold border-b border-ink/20 pb-1 print:border-neutral-400 print:text-black";
const muted = "text-muted print:text-neutral-700";

export default async function ResumePage() {
  const [projects, skills] = await Promise.all([listProjects().catch(() => []), listSkills().catch(() => [])]);
  const { about } = portfolioContent;

  return (
    <main className="mx-auto max-w-3xl px-5 py-12 lg:px-8 print:max-w-none print:bg-white print:p-0 print:text-black">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 print:hidden">
        <Link href="/" className="text-sm font-semibold text-accent underline underline-offset-4">Back to site</Link>
        <PrintButton />
      </div>

      <header>
        <h1 className="font-display text-4xl font-semibold tracking-tight print:text-black">{portfolioContent.name}</h1>
        <p className="mt-2 text-lg text-accent print:text-neutral-800">{portfolioContent.headline}</p>
        <p className={`mt-3 text-sm ${muted}`}>{contactLine().join("  |  ")}</p>
      </header>

      <section aria-labelledby="resume-summary" className="mt-8">
        <h2 id="resume-summary" className={heading}>Summary</h2>
        <p className={`mt-3 leading-7 ${muted}`}>{about.introduction} {about.detail}</p>
      </section>

      <section aria-labelledby="resume-experience" className="mt-8">
        <h2 id="resume-experience" className={heading}>Experience</h2>
        <ul className="mt-3 space-y-4">
          {portfolioContent.timeline.map((item) => (
            <li key={`${item.year}-${item.organization}`} className="break-inside-avoid">
              <p className="flex flex-wrap items-baseline justify-between gap-2"><span className="font-semibold">{item.title}, {item.organization}</span><span className={`text-sm ${muted}`}>{item.year}</span></p>
              <p className={`mt-1 text-sm leading-6 ${muted}`}>{item.summary}</p>
            </li>
          ))}
        </ul>
      </section>

      {projects.length > 0 ? (
        <section aria-labelledby="resume-projects" className="mt-8">
          <h2 id="resume-projects" className={heading}>Projects</h2>
          <ul className="mt-3 space-y-4">
            {projects.map((project) => (
              <li key={project.slug} className="break-inside-avoid">
                <p className="flex flex-wrap items-baseline justify-between gap-2"><span className="font-semibold">{project.title}</span><span className={`text-sm ${muted}`}>{project.year}</span></p>
                <p className={`mt-1 text-sm leading-6 ${muted}`}>{project.summary}</p>
                <ul className={`mt-1 list-disc pl-5 text-sm leading-6 ${muted}`}>{project.outcomes.map((outcome) => <li key={outcome}>{outcome}</li>)}</ul>
                {project.stack && project.stack.length > 0 ? <p className={`mt-1 text-xs ${muted}`}>Stack: {project.stack.join(", ")}</p> : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {skills.length > 0 ? (
        <section aria-labelledby="resume-skills" className="mt-8">
          <h2 id="resume-skills" className={heading}>Skills</h2>
          <ul className="mt-3 space-y-1 text-sm leading-6">
            {skills.map((skill) => (
              <li key={skill.id} className="break-inside-avoid"><span className="font-semibold">{skill.name}:</span> <span className={muted}>{skill.tools && skill.tools.length > 0 ? skill.tools.join(", ") : skill.description}</span></li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="resume-education" className="mt-8">
        <h2 id="resume-education" className={heading}>Education</h2>
        <ul className={`mt-3 list-disc space-y-1 pl-5 text-sm leading-6 ${muted}`}>{about.education.map((line) => <li key={line}>{line}</li>)}</ul>
      </section>

      <section aria-labelledby="resume-recognition" className="mt-8">
        <h2 id="resume-recognition" className={heading}>Recognition and certifications</h2>
        <ul className={`mt-3 list-disc space-y-1 pl-5 text-sm leading-6 ${muted}`}>{about.recognition.map((line) => <li key={line}>{line}</li>)}</ul>
      </section>

      <section aria-labelledby="resume-leadership" className="mt-8">
        <h2 id="resume-leadership" className={heading}>Leadership</h2>
        <ul className={`mt-3 list-disc space-y-1 pl-5 text-sm leading-6 ${muted}`}>{about.leadership.map((line) => <li key={line}>{line}</li>)}</ul>
      </section>
    </main>
  );
}
