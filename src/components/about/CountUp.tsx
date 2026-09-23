"use client";

import { useEffect, useRef } from "react";

const DURATION_MS = 1200;

export function formatStat(value: number, decimals = 0, suffix = "") {
  return `${value.toFixed(decimals)}${suffix}`;
}

/**
 * Renders the final value on the server and for anyone who prefers reduced motion. When the number
 * starts below the fold it resets to zero and counts up the first time it scrolls into view;
 * screen readers get the final value from the visually hidden copy.
 */
export function CountUp({ value, decimals = 0, suffix = "" }: { value: number; decimals?: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const final = formatStat(value, decimals, suffix);

  useEffect(() => {
    const element = ref.current;
    if (!element || typeof IntersectionObserver === "undefined") return;
    if (typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const box = element.getBoundingClientRect();
    if (box.top < window.innerHeight && box.bottom > 0) return; // already on screen: keep the final value, no flash

    element.textContent = formatStat(0, decimals, suffix);
    let frame = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        observer.disconnect();
        const started = performance.now();
        const tick = (now: number) => {
          const t = Math.min(1, (now - started) / DURATION_MS);
          element.textContent = formatStat(value * (1 - Math.pow(1 - t, 3)), decimals, suffix);
          if (t < 1) frame = window.requestAnimationFrame(tick);
        };
        frame = window.requestAnimationFrame(tick);
      },
      { threshold: 0.6 },
    );
    observer.observe(element);
    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(frame);
      element.textContent = final;
    };
  }, [value, decimals, suffix, final]);

  return (
    <>
      <span className="sr-only">{final}</span>
      <span ref={ref} aria-hidden="true">{final}</span>
    </>
  );
}
