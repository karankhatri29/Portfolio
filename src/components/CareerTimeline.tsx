"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent } from "react";

import type { TimelineItem } from "@/data/portfolio";

const prefersReducedMotion = () =>
  typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function CareerTimeline({ items }: { items: TimelineItem[] }) {
  const baseId = useId();
  const listRef = useRef<HTMLDListElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [active, setActive] = useState(0);
  const [expanded, setExpanded] = useState<number | null>(null);

  // Scroll progress drives the gold fill on the rail without re-rendering React.
  useEffect(() => {
    const list = listRef.current;
    const fill = fillRef.current;
    if (!list || !fill) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = list.getBoundingClientRect();
      const progress = (window.innerHeight / 2 - rect.top) / rect.height;
      fill.style.setProperty("--progress", String(Math.min(1, Math.max(0, progress))));
    };
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [items.length]);

  // Active entry = the one crossing the middle of the viewport; also reveals entries on entry.
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const nodes = itemRefs.current.filter((node): node is HTMLDivElement => Boolean(node));
    const motionOk = !prefersReducedMotion();

    const activeObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(Number((entry.target as HTMLElement).dataset.index));
        }
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );

    const revealObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).dataset.reveal = "shown";
            revealObserver.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );

    nodes.forEach((node) => {
      activeObserver.observe(node);
      if (motionOk) {
        node.dataset.reveal = "hidden";
        revealObserver.observe(node);
      }
    });
    return () => {
      activeObserver.disconnect();
      revealObserver.disconnect();
    };
  }, [items.length]);

  const select = useCallback((index: number) => {
    setActive(index);
    setExpanded((current) => (current === index ? null : index));
    itemRefs.current[index]?.scrollIntoView?.({ block: "center", behavior: prefersReducedMotion() ? "auto" : "smooth" });
  }, []);

  const onKeyDown = (event: KeyboardEvent<HTMLDListElement>) => {
    const keys: Record<string, number> = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 };
    const current = buttonRefs.current.findIndex((button) => button === document.activeElement);
    let next: number | undefined;
    if (event.key in keys && current !== -1) next = Math.min(items.length - 1, Math.max(0, current + keys[event.key]));
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = items.length - 1;
    if (next === undefined) return;
    event.preventDefault();
    buttonRefs.current[next]?.focus();
    setActive(next);
    itemRefs.current[next]?.scrollIntoView?.({ block: "center", behavior: prefersReducedMotion() ? "auto" : "smooth" });
  };

  return (
    <section aria-labelledby="timeline-title" className="border-b border-ink/10 py-16 lg:py-24">
      <h2 id="timeline-title" className="text-center font-display text-3xl font-semibold lg:text-4xl">A short timeline</h2>
      <p className="mx-auto mt-3 max-w-xl text-center text-sm text-muted">Scroll through, or select a milestone to see what I used.</p>
      {items.length ? (
        <dl ref={listRef} onKeyDown={onKeyDown} className="relative mx-auto mt-14 max-w-6xl lg:mt-20">
          <div aria-hidden="true" className="absolute bottom-0 left-5 top-0 w-px -translate-x-1/2 bg-ink/20 md:left-1/2">
            <div ref={fillRef} className="w-full bg-accent" style={{ height: "calc(var(--progress, 0) * 100%)" }} />
          </div>
          {items.map((item, index) => {
            const isActive = index === active;
            const isOpen = index === expanded;
            const detailId = `${baseId}-detail-${index}`;
            return (
              <div
                key={`${item.year}-${item.title}`}
                ref={(node) => { itemRefs.current[index] = node; }}
                data-index={index}
                data-active={isActive}
                className={`timeline-item relative grid grid-cols-[2.5rem_1fr] gap-x-2 py-8 transition-opacity duration-500 md:grid-cols-[1fr_5rem_1fr] md:gap-x-0 md:py-14 lg:py-20 ${isActive ? "opacity-100" : "opacity-50 hover:opacity-90 focus-within:opacity-100"}`}
              >
                <dt className="col-start-2 md:col-start-1 md:row-start-1 md:pr-8 md:text-right lg:pr-12">
                  <button
                    type="button"
                    ref={(node) => { buttonRefs.current[index] = node; }}
                    onClick={() => select(index)}
                    onFocus={() => setActive(index)}
                    aria-expanded={isOpen}
                    aria-controls={detailId}
                    aria-current={isActive ? "step" : undefined}
                    className="group rounded text-left font-display text-3xl font-light leading-tight text-ink transition-colors hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent sm:text-4xl md:text-right lg:text-5xl xl:text-6xl"
                  >
                    <span
                      aria-hidden="true"
                      className={`absolute left-5 top-11 z-10 h-3.5 w-3.5 -translate-x-1/2 rounded-full border-2 transition-all duration-300 group-hover:scale-125 md:left-1/2 md:top-[4.25rem] lg:top-[6.25rem] ${isActive ? "scale-150 border-accent bg-accent shadow-[0_0_0_6px_rgb(var(--color-accent)/0.2)]" : "border-ink/60 bg-paper"}`}
                    />
                    {item.year}
                  </button>
                </dt>
                <dd className="col-start-2 mt-3 md:col-start-3 md:row-start-1 md:mt-0 md:pl-8 lg:pl-12">
                  <h3 className="text-xl font-semibold lg:text-2xl">{item.title}</h3>
                  <p className="mt-1 text-sm text-accent">{item.organization}</p>
                  <p className="mt-3 max-w-xl leading-7 text-muted lg:text-lg lg:leading-8">{item.summary}</p>
                  <div id={detailId} className={`grid transition-[grid-template-rows] duration-300 ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                    <div className="overflow-hidden">
                      {item.tags?.length ? (
                        <ul aria-label={`Tools used for ${item.title}`} className="flex flex-wrap gap-2 pt-4">
                          {item.tags.map((tag) => (
                            <li key={tag} className="rounded-full border border-accent/40 px-3 py-1 text-xs text-ink">{tag}</li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  </div>
                </dd>
              </div>
            );
          })}
        </dl>
      ) : <p className="mt-8 text-center text-muted">Timeline coming soon.</p>}
    </section>
  );
}
