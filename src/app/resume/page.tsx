import type { Metadata } from "next";
import Link from "next/link";

import { PrintButton } from "@/components/PrintButton";
import { resume } from "@/data/resume";

export const metadata: Metadata = {
  title: "Resume",
  description: `Resume of ${resume.name}: education, technical skills, projects and experience, research, achievements and leadership.`,
  alternates: { canonical: "/resume" },
};

const heading = "font-display text-xl font-semibold border-b border-ink/20 pb-1 print:border-neutral-400 print:text-black";
const muted = "text-muted print:text-neutral-700";
const row = "flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1";

// The page mirrors the resume document, section by section, and prints as a clean black-on-white page.
export default function ResumePage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-12 lg:px-8 print:max-w-none print:bg-white print:p-0 print:text-black">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 print:hidden">
        <Link href="/" className="inline-flex min-h-11 items-center text-sm font-semibold text-accent underline underline-offset-4">Back to site</Link>
        <PrintButton />
      </div>

      <div className="border border-accent/20 bg-ink/[0.035] p-6 backdrop-blur-xl sm:p-10 print:border-0 print:bg-transparent print:p-0 print:backdrop-blur-none">
        <header>
          <h1 className="font-display text-4xl font-semibold tracking-tight print:text-black">{resume.name}</h1>
          <p className={`mt-3 text-sm ${muted}`}>
            {resume.location}
            {resume.links.map((link) => (
              <span key={link.href}>
                {"  |  "}
                <a href={link.href} {...(link.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})} className="underline-offset-4 hover:text-accent hover:underline print:text-neutral-700">{link.label}</a>
              </span>
            ))}
          </p>
        </header>

        <section aria-labelledby="resume-education" className="mt-8">
          <h2 id="resume-education" className={heading}>Education</h2>
          <ul className="mt-3 space-y-3">
            {resume.education.map((item) => (
              <li key={item.institution} className="break-inside-avoid">
                <p className={row}><span className="font-semibold">{item.institution}</span><span className={`text-sm ${muted}`}>{item.period}</span></p>
                <p className={`mt-0.5 text-sm leading-6 ${muted}`}>{item.program} · {item.score}</p>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="resume-skills" className="mt-8">
          <h2 id="resume-skills" className={heading}>Technical skills</h2>
          <ul className="mt-3 space-y-1.5 text-sm leading-6">
            {resume.skills.map((skill) => (
              <li key={skill.category} className="break-inside-avoid sm:grid sm:grid-cols-[13rem_1fr] sm:gap-4">
                <span className="block font-semibold">{skill.category}</span>
                <span className={muted}>{skill.items}</span>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="resume-experience" className="mt-8">
          <h2 id="resume-experience" className={heading}>Projects &amp; experience</h2>
          <ul className="mt-3 space-y-5">
            {resume.experience.map((entry) => (
              <li key={entry.title} className="break-inside-avoid">
                <p className={row}><span className="font-semibold">{entry.title} – {entry.role}</span><span className={`text-sm ${muted}`}>{entry.period}</span></p>
                <p className={`mt-0.5 text-sm italic ${muted}`}>Tech stack: {entry.stack}</p>
                <ul className={`mt-1.5 list-disc space-y-1 pl-5 text-sm leading-6 ${muted}`}>
                  {entry.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
                </ul>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="resume-papers" className="mt-8">
          <h2 id="resume-papers" className={heading}>Research papers</h2>
          <ul className={`mt-3 list-disc space-y-1 pl-5 text-sm leading-6 ${muted}`}>{resume.papers.map((paper) => <li key={paper}>{paper}</li>)}</ul>
        </section>

        <section aria-labelledby="resume-achievements" className="mt-8">
          <h2 id="resume-achievements" className={heading}>Achievements &amp; certifications</h2>
          <ul className={`mt-3 list-disc space-y-1 pl-5 text-sm leading-6 ${muted}`}>
            {resume.achievements.map((item) => <li key={item.title}><span className="font-semibold text-ink print:text-black">{item.title}</span> ({item.detail})</li>)}
            <li><span className="font-semibold text-ink print:text-black">Certifications:</span> {resume.certifications.join(" | ")}</li>
          </ul>
        </section>

        <section aria-labelledby="resume-leadership" className="mt-8">
          <h2 id="resume-leadership" className={heading}>Leadership roles</h2>
          <ul className={`mt-3 list-disc space-y-1 pl-5 text-sm leading-6 ${muted}`}>{resume.leadership.map((line) => <li key={line}>{line}</li>)}</ul>
        </section>
      </div>
    </main>
  );
}
