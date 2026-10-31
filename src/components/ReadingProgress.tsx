"use client";

import { useEffect, useRef } from "react";

/** A slim bar across the top of a post that fills as you read down it. Decorative, so hidden from assistive technology. */
export function ReadingProgress() {
  const bar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const page = document.documentElement;
      const scrollable = page.scrollHeight - page.clientHeight;
      const progress = scrollable > 0 ? Math.min(1, Math.max(0, page.scrollTop / scrollable)) : 0;
      bar.current?.style.setProperty("--progress", String(progress));
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
  }, []);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5">
      <div ref={bar} data-testid="reading-progress" className="h-full origin-left bg-accent shadow-[0_0_10px_rgb(var(--color-accent))]" style={{ transform: "scaleX(var(--progress, 0))" }} />
    </div>
  );
}
