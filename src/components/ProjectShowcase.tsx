"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent } from "react";

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

const prefersReducedMotion = () => typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function ProjectShowcase({ projects, fallbackGithubUrl }: { projects: Project[]; fallbackGithubUrl?: string }) {
  const regionId = useId();
  const scroller = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const thumb = useRef<HTMLDivElement>(null);
  const drag = useRef<{ offset: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const [edges, setEdges] = useState({ start: true, end: false, thumbLeft: 0, thumbWidth: 1, progress: 0 });

  useEffect(() => {
    const element = scroller.current;
    if (!element) return;
    const update = () => {
      const overflow = element.scrollWidth - element.clientWidth;
      const thumbWidth = element.scrollWidth > 0 ? Math.min(1, Math.max(0.1, element.clientWidth / element.scrollWidth)) : 1;
      const progress = overflow > 0 ? Math.min(1, Math.max(0, element.scrollLeft / overflow)) : 0;
      setEdges({ start: element.scrollLeft <= 4, end: element.scrollLeft + element.clientWidth >= element.scrollWidth - 4, thumbLeft: progress * (1 - thumbWidth), thumbWidth, progress });
    };
    const frame = window.requestAnimationFrame(update);
    element.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.cancelAnimationFrame(frame);
      element.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [projects.length]);

  function scrollByPage(direction: 1 | -1, fraction = 0.8) {
    const element = scroller.current;
    if (!element) return;
    element.scrollBy({ left: direction * Math.max(320, element.clientWidth * fraction), behavior: prefersReducedMotion() ? "auto" : "smooth" });
  }

  // Maps a pointer position on the track to a scroll position, keeping the grabbed point of the handle under the pointer.
  function scrollToPointer(clientX: number, offset: number) {
    const element = scroller.current;
    const trackElement = track.current;
    const thumbElement = thumb.current;
    if (!element || !trackElement || !thumbElement) return;
    const trackRect = trackElement.getBoundingClientRect();
    const room = trackRect.width - thumbElement.getBoundingClientRect().width;
    if (room <= 0) return;
    const progress = Math.min(1, Math.max(0, (clientX - trackRect.left - offset) / room));
    element.scrollTo({ left: progress * (element.scrollWidth - element.clientWidth), behavior: "auto" });
  }

  function onTrackPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.button > 0) return; // primary mouse button, touch and pen all report 0
    const thumbRect = thumb.current?.getBoundingClientRect();
    const onThumb = Boolean(thumbRect) && event.clientX >= thumbRect!.left && event.clientX <= thumbRect!.right;
    const offset = onThumb ? event.clientX - thumbRect!.left : (thumbRect?.width ?? 0) / 2;
    drag.current = { offset };
    setDragging(true);
    event.currentTarget.setPointerCapture?.(event.pointerId);
    scrollToPointer(event.clientX, offset);
  }

  function onTrackPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (drag.current) scrollToPointer(event.clientX, drag.current.offset);
  }

  function endDrag(event: PointerEvent<HTMLDivElement>) {
    if (!drag.current) return;
    drag.current = null;
    setDragging(false);
    event.currentTarget.releasePointerCapture?.(event.pointerId);
  }

  function onTrackKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const element = scroller.current;
    if (!element) return;
    const behavior = prefersReducedMotion() ? "auto" : "smooth";
    if (event.key === "ArrowRight") scrollByPage(1, 0.4);
    else if (event.key === "ArrowLeft") scrollByPage(-1, 0.4);
    else if (event.key === "Home") element.scrollTo({ left: 0, behavior });
    else if (event.key === "End") element.scrollTo({ left: element.scrollWidth, behavior });
    else return;
    event.preventDefault();
  }

  // Soft fades on whichever sides still have cards hidden, so nothing is hard-clipped mid-word.
  const fade = edges.start && edges.end ? "" : edges.start ? "[mask-image:linear-gradient(to_right,black_90%,transparent)]" : edges.end ? "[mask-image:linear-gradient(to_right,transparent,black_8%)]" : "[mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]";

  return (
    <section id="work" aria-labelledby="projects-title" className="py-16 lg:py-24">
      <div className="flex items-end justify-between gap-6">
        <div>
          <h2 id="projects-title" className="font-display text-3xl font-semibold lg:text-4xl">Selected work</h2>
          <p className="mt-3 text-sm text-muted">Scroll sideways, or drag the line below.</p>
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
          id={regionId}
          ref={scroller}
          role="region"
          aria-label="Selected projects, scrolls horizontally"
          tabIndex={0}
          className={`mt-10 snap-x ${dragging ? "snap-none" : "snap-mandatory"} overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${fade}`}
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

      {projects.length && edges.thumbWidth < 0.999 ? (
        <div
          ref={track}
          role="scrollbar"
          aria-controls={regionId}
          aria-orientation="horizontal"
          aria-label="Scroll projects"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(edges.progress * 100)}
          tabIndex={0}
          data-testid="scroll-progress"
          onPointerDown={onTrackPointerDown}
          onPointerMove={onTrackPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onKeyDown={onTrackKeyDown}
          className="group relative mt-1 h-6 w-full cursor-pointer touch-none select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <div aria-hidden="true" className="absolute inset-x-0 top-1/2 h-px bg-ink/15" />
          <div
            ref={thumb}
            aria-hidden="true"
            data-testid="scroll-progress-thumb"
            className={`absolute top-1/2 -translate-y-1/2 rounded-full bg-accent transition-[height] duration-150 ${dragging ? "h-1.5 cursor-grabbing" : "h-0.5 group-hover:h-1"}`}
            style={{ left: `${edges.thumbLeft * 100}%`, width: `${edges.thumbWidth * 100}%` }}
          />
        </div>
      ) : null}
    </section>
  );
}
