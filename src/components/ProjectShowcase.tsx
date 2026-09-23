"use client";

import { useEffect, useRef, useState } from "react";

import { ProjectCard } from "@/components/ProjectCard";
import type { Project } from "@/lib/content/repository";

function Arrow({ direction }: { direction: "left" | "right" }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d={direction === "left" ? "m15 5-7 7 7 7" : "m9 5 7 7-7 7"} />
    </svg>
  );
}

const control = "flex h-11 w-11 items-center justify-center rounded-full border border-ink/15 transition-colors hover:border-accent hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:pointer-events-none disabled:opacity-30";

export function ProjectShowcase({ projects, fallbackGithubUrl }: { projects: Project[]; fallbackGithubUrl?: string }) {
  const scroller = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  useEffect(() => {
    const element = scroller.current;
    if (!element) return;
    const update = () => setEdges({ start: element.scrollLeft <= 4, end: element.scrollLeft + element.clientWidth >= element.scrollWidth - 4 });
    const frame = window.requestAnimationFrame(update);
    element.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.cancelAnimationFrame(frame);
      element.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [projects.length]);

  function scrollByPage(direction: 1 | -1) {
    const element = scroller.current;
    if (!element) return;
    const reduced = typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    element.scrollBy({ left: direction * Math.max(320, element.clientWidth * 0.8), behavior: reduced ? "auto" : "smooth" });
  }

  return (
    <section id="work" aria-labelledby="projects-title" className="py-16 lg:py-24">
      <div className="flex items-end justify-between gap-6">
        <div>
          <h2 id="projects-title" className="font-display text-3xl font-semibold lg:text-4xl">Selected work</h2>
          <p className="mt-3 text-sm text-muted">Scroll sideways for more.</p>
        </div>
        {projects.length > 1 ? (
          <div className="flex gap-3">
            <button type="button" aria-label="Previous projects" disabled={edges.start} onClick={() => scrollByPage(-1)} className={control}><Arrow direction="left" /></button>
            <button type="button" aria-label="Next projects" disabled={edges.end} onClick={() => scrollByPage(1)} className={control}><Arrow direction="right" /></button>
          </div>
        ) : null}
      </div>

      {projects.length ? (
        <div
          ref={scroller}
          role="region"
          aria-label="Selected projects, scrolls horizontally"
          tabIndex={0}
          className={`mt-10 snap-x snap-mandatory overflow-x-auto pb-4 [scrollbar-width:thin] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${edges.end ? "" : "[mask-image:linear-gradient(to_right,black_90%,transparent)]"}`}
        >
          <ul className="flex gap-5">
            {projects.map((project) => (
              <li key={project.slug} className="w-[82%] shrink-0 snap-start sm:w-[22rem] lg:w-[25rem]">
                <ProjectCard project={project} fallbackGithubUrl={fallbackGithubUrl} />
              </li>
            ))}
          </ul>
        </div>
      ) : <p className="mt-8 text-muted">Projects coming soon.</p>}
    </section>
  );
}
