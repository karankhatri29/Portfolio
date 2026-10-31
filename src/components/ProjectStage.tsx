"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { GitHubIcon } from "@/components/GitHubIcon";
import type { Project } from "@/lib/content/repository";

/**
 * Large-screen version of "Selected work": the list scrolls on the right while the project in focus
 * is shown big on the left, which stays in place. Smaller screens use ProjectShowcase instead.
 */
export function ProjectStage({ projects, fallbackGithubUrl }: { projects: Project[]; fallbackGithubUrl?: string }) {
  const [active, setActive] = useState(0);
  const items = useRef<(HTMLLIElement | null)[]>([]);

  // The project crossing the middle of the viewport is the one in focus.
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const watcher = new IntersectionObserver(
      (entries) => entries.forEach((entry) => { if (entry.isIntersecting) setActive(Number((entry.target as HTMLElement).dataset.index)); }),
      { rootMargin: "-40% 0px -50% 0px" },
    );
    items.current.forEach((node) => node && watcher.observe(node));
    return () => watcher.disconnect();
  }, [projects.length]);

  const current = projects[active] ?? projects[0];

  return (
    <section aria-labelledby="projects-stage-title" className="py-16 lg:py-24">
      <h2 id="projects-stage-title" className="font-display text-3xl font-semibold lg:text-4xl">Selected work</h2>
      <p className="mt-3 text-sm text-muted">Scroll the list. The project in focus is shown on the left.</p>

      {current ? (
        <div className="mt-14 grid gap-16 lg:grid-cols-[1fr_1.15fr] lg:gap-20">
          <div aria-hidden="true" className="sticky top-28 hidden self-start lg:block">
            <div key={current.slug} className="timeline-fade">
              <p className="font-display text-[clamp(7rem,13vw,11rem)] font-bold leading-[0.8] tracking-tighter text-transparent [-webkit-text-stroke:1.25px_rgb(var(--color-accent)/0.6)]">{current.year}</p>
              <p className="mt-8 max-w-[16ch] font-display text-4xl font-semibold leading-[1.05] tracking-tight">{current.title}</p>
              <p className="mt-4 text-sm font-medium text-accent">{current.role}</p>
            </div>
            <p className="mt-10 text-xs text-muted">{active + 1} of {projects.length}</p>
          </div>

          <ol>
            {projects.map((project, index) => {
              const githubHref = project.githubUrl || fallbackGithubUrl;
              const stack = project.stack ?? [];
              return (
                <li
                  key={project.slug}
                  ref={(node) => { items.current[index] = node; }}
                  data-index={index}
                  className={`min-h-[18rem] border-t border-ink/10 py-10 transition-opacity duration-300 motion-reduce:transition-none ${index === active ? "opacity-100" : "opacity-60"}`}
                >
                  <h3 className="sr-only">{project.title}</h3>
                  <p className="text-sm font-semibold text-accent">{project.year} · {project.role}</p>
                  <p className="mt-4 max-w-xl text-lg leading-8 text-muted">{project.summary}</p>
                  {stack.length ? (
                    <ul aria-label={`Stack for ${project.title}`} className="mt-6 flex flex-wrap gap-2">
                      {stack.map((tool) => <li key={tool} className="rounded-full border border-ink/15 px-3 py-1 text-xs text-muted">{tool}</li>)}
                    </ul>
                  ) : null}
                  <div className="mt-8 flex items-center gap-5">
                    <Link href={`/projects/${project.slug}`} className="inline-flex min-h-11 items-center border-b border-accent text-sm font-semibold text-accent transition hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper">View {project.title} project</Link>
                    {githubHref ? (
                      <a href={githubHref} target="_blank" rel="noopener noreferrer" aria-label={project.githubUrl ? `${project.title} on GitHub` : "GitHub profile"} className="rounded-full p-2 text-muted transition-colors hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">
                        <GitHubIcon className="h-6 w-6" />
                      </a>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      ) : <p className="mt-8 text-muted">Projects coming soon.</p>}
    </section>
  );
}
