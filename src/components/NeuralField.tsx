"use client";

import { useEffect, useRef } from "react";

import { LOGO_BOUNDS, fieldNodeCount, logoGraph } from "@/lib/neural-field";

/**
 * ambient: drifting network that links to a finger or cursor.
 * logo:    the dots assemble into the K³ logo; tapping breaks it apart and it re-forms.
 * scroll:  the network connects and drifts as the page scrolls.
 */
export type FieldMode = "ambient" | "logo" | "scroll";

type Dot = {
  x: number; y: number;
  vx: number; vy: number; // gentle drift
  bx: number; by: number; // burst from a tap, decays on its own
  tx: number; ty: number; // logo target
  hub: boolean; phase: number; speed: number;
};

const BUCKETS = 4; // lines are batched by opacity so each frame makes a handful of strokes, not hundreds
const FRAME = 1000 / 60;
const STAR = "214,228,240"; // pale blue-white, the colour of the stars and constellation lines

const channels = (name: string, fallback: string) => {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value ? value.split(/\s+/).join(",") : fallback;
};

/**
 * Decorative canvas that fills its positioned parent. It reads the site's theme colours, so light and dark both work.
 * Pointer and tap events are listened for on the nearest `[data-field-host]` (or the parent), so content above it still works.
 */
export function NeuralField({ mode = "ambient", className }: { mode?: FieldMode; className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas?.closest<HTMLElement>("[data-field-host]") ?? canvas?.parentElement;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !host || !ctx) return;

    const reduceMotion = typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const logo = logoGraph();
    let width = 0;
    let height = 0;
    let dots: Dot[] = [];
    let visible = typeof IntersectionObserver === "undefined";
    let frame = 0;
    let last = 0;
    let started = performance.now();
    let colours = { ink: "236,236,232", accent: "63,205,238" };
    let ticks = 0;
    const pointer = { x: -999, y: -999, active: false };
    const eased = { x: -999, y: -999, weight: 0 };

    function build() {
      const box = canvas!.getBoundingClientRect();
      width = box.width;
      height = box.height;
      if (!width || !height) return;
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas!.width = Math.round(width * ratio);
      canvas!.height = Math.round(height * ratio);
      ctx!.setTransform(ratio, 0, 0, ratio, 0, 0);

      if (mode === "logo") {
        const scale = Math.min((width * 0.8) / LOGO_BOUNDS.width, (height * 0.5) / LOGO_BOUNDS.height);
        const offsetX = width / 2 - (LOGO_BOUNDS.x + LOGO_BOUNDS.width / 2) * scale;
        const offsetY = height * 0.2 - LOGO_BOUNDS.y * scale;
        dots = logo.points.map((point) => {
          const tx = offsetX + point.x * scale;
          const ty = offsetY + point.y * scale;
          return { x: reduceMotion ? tx : Math.random() * width, y: reduceMotion ? ty : Math.random() * height, vx: 0, vy: 0, bx: 0, by: 0, tx, ty, hub: point.hub, phase: Math.random() * 7, speed: 0 };
        });
        started = performance.now();
      } else {
        dots = Array.from({ length: fieldNodeCount(width, height) }, () => ({
          x: Math.random() * width, y: Math.random() * height, vx: 0, vy: 0, bx: 0, by: 0, tx: 0, ty: 0, hub: false,
          phase: Math.random() * Math.PI * 2, speed: 0.12 + Math.random() * 0.2,
        }));
      }
      draw(performance.now(), 1);
    }

    function drawLogo(now: number, step: number) {
      const { ink, accent } = colours;
      const seconds = (now - started) / 1000;
      if (!reduceMotion) {
        const pull = 1 - Math.pow(1 - 0.07, step);
        const damp = Math.pow(0.84, step);
        for (const dot of dots) {
          dot.vx = (dot.vx + (dot.tx - dot.x) * pull) * damp;
          dot.vy = (dot.vy + (dot.ty - dot.y) * pull) * damp;
          const dx = dot.x - pointer.x;
          const dy = dot.y - pointer.y;
          const distance = Math.hypot(dx, dy);
          if (pointer.active && distance < 95 && distance > 0) { dot.vx += (dx / distance) * 2.2 * step; dot.vy += (dy / distance) * 2.2 * step; }
          dot.x += (dot.vx + Math.sin(seconds * 1.4 + dot.phase) * 0.12) * step;
          dot.y += (dot.vy + Math.cos(seconds * 1.2 + dot.phase) * 0.12) * step;
        }
      }
      ctx!.lineWidth = 1.3;
      ctx!.strokeStyle = `rgba(${accent},.6)`;
      ctx!.beginPath();
      for (const [from, to] of logo.links) { ctx!.moveTo(dots[from].x, dots[from].y); ctx!.lineTo(dots[to].x, dots[to].y); }
      ctx!.stroke();
      for (const dot of dots) {
        ctx!.fillStyle = dot.hub ? `rgb(${accent})` : `rgba(${ink},.85)`;
        ctx!.beginPath();
        ctx!.arc(dot.x, dot.y, dot.hub ? 4.6 : 2, 0, 7);
        ctx!.fill();
      }
    }

    function draw(now: number, step: number) {
      if (!width) return;
      ctx!.clearRect(0, 0, width, height);
      if (ticks++ % 40 === 0) colours = { ink: channels("--color-ink", colours.ink), accent: channels("--color-accent", colours.accent) };
      if (mode === "logo") { drawLogo(now, step); return; }

      const { accent } = colours;
      const ink = STAR;
      const seconds = now / 1000;
      const scrolled = mode === "scroll" ? window.scrollY : 0;
      const progress = Math.min(1, scrolled / (height * 0.9));
      const reach = mode === "scroll" ? 90 + progress * 90 : 112;
      const shift = -scrolled * 0.35;
      const edge = 60;

      // The pointer glides toward the finger and its pull fades in and out, so links never pop.
      const follow = 1 - Math.pow(1 - 0.22, step);
      if (pointer.active) {
        if (eased.weight < 0.02) { eased.x = pointer.x; eased.y = pointer.y; }
        eased.x += (pointer.x - eased.x) * follow;
        eased.y += (pointer.y - eased.y) * follow;
      }
      eased.weight += ((pointer.active ? 1 : 0) - eased.weight) * (1 - Math.pow(1 - 0.1, step));

      if (!reduceMotion) {
        const steer = 1 - Math.pow(1 - 0.04, step);
        const burstDecay = Math.pow(0.9, step);
        for (const dot of dots) {
          // A slow flow field: every dot follows a smoothly turning heading instead of random jitter.
          const heading = dot.phase + seconds * (0.15 + dot.speed * 0.4);
          let tx = Math.cos(heading) * dot.speed;
          let ty = Math.sin(heading) * dot.speed;
          if (dot.x < edge) tx += (edge - dot.x) * 0.004;
          else if (dot.x > width - edge) tx -= (dot.x - (width - edge)) * 0.004;
          if (dot.y < edge) ty += (edge - dot.y) * 0.004;
          else if (dot.y > height - edge) ty -= (dot.y - (height - edge)) * 0.004;
          dot.vx += (tx - dot.vx) * steer;
          dot.vy += (ty - dot.vy) * steer;

          if (eased.weight > 0.02) {
            const dx = dot.x - eased.x;
            const dy = dot.y - (eased.y - shift);
            const distance = Math.hypot(dx, dy);
            if (distance < 130 && distance > 0) {
              const push = Math.pow(1 - distance / 130, 2) * 1.6 * eased.weight * step;
              dot.x += (dx / distance) * push;
              dot.y += (dy / distance) * push;
            }
          }
          dot.x += (dot.vx + dot.bx) * step;
          dot.y += (dot.vy + dot.by) * step;
          dot.bx *= burstDecay;
          dot.by *= burstDecay;
        }
      }

      const buckets: number[][] = Array.from({ length: BUCKETS }, () => []);
      const strength = 0.2 + progress * 0.25;
      for (let i = 0; i < dots.length; i += 1) {
        const a = dots[i];
        const ay = a.y + shift;
        for (let j = i + 1; j < dots.length; j += 1) {
          const b = dots[j];
          const distance = Math.hypot(a.x - b.x, ay - (b.y + shift));
          if (distance < reach) buckets[Math.min(BUCKETS - 1, Math.floor((1 - distance / reach) * BUCKETS))].push(a.x, ay, b.x, b.y + shift);
        }
      }
      ctx!.lineWidth = 1;
      buckets.forEach((lines, index) => {
        if (!lines.length) return;
        ctx!.strokeStyle = `rgba(${ink},${(((index + 0.5) / BUCKETS) * strength * 1.5).toFixed(3)})`;
        ctx!.beginPath();
        for (let k = 0; k < lines.length; k += 4) { ctx!.moveTo(lines[k], lines[k + 1]); ctx!.lineTo(lines[k + 2], lines[k + 3]); }
        ctx!.stroke();
      });

      ctx!.lineWidth = 1.3;
      for (const dot of dots) {
        const y = dot.y + shift;
        const toPointer = eased.weight > 0.02 ? Math.hypot(dot.x - eased.x, y - eased.y) : Infinity;
        const near = toPointer < 160;
        if (near) {
          ctx!.strokeStyle = `rgba(${accent},${((1 - toPointer / 160) * 0.95 * eased.weight).toFixed(3)})`;
          ctx!.beginPath(); ctx!.moveTo(dot.x, y); ctx!.lineTo(eased.x, eased.y); ctx!.stroke();
        }
        // Stars differ in size, twinkle slowly and out of step, and the brightest ones get a soft halo.
        const size = 1 + dot.speed * 3.2;
        const twinkle = reduceMotion ? 0.85 : 0.65 + 0.3 * Math.sin(seconds * (0.7 + (dot.phase % 1)) + dot.phase * 3);
        if (dot.speed > 0.28 || near) {
          ctx!.fillStyle = near ? `rgba(${accent},${(0.16 * eased.weight).toFixed(3)})` : `rgba(${ink},${(0.07 * twinkle).toFixed(3)})`;
          ctx!.beginPath(); ctx!.arc(dot.x, y, size * 4.5, 0, 7); ctx!.fill();
        }
        ctx!.fillStyle = near ? `rgba(${accent},${(0.6 + 0.4 * eased.weight).toFixed(2)})` : `rgba(${ink},${twinkle.toFixed(2)})`;
        ctx!.beginPath(); ctx!.arc(dot.x, y, near ? size + 0.8 : size, 0, 7); ctx!.fill();
      }
    }

    function loop(now: number) {
      const step = last ? Math.min(3, (now - last) / FRAME) : 1; // capped, so a stalled tab does not teleport the dots
      last = now;
      draw(now, step);
      frame = visible && !reduceMotion ? requestAnimationFrame(loop) : 0;
    }
    function wake() {
      if (visible && !frame && !reduceMotion) { last = 0; frame = requestAnimationFrame(loop); }
    }

    const position = (event: PointerEvent) => {
      const box = canvas.getBoundingClientRect();
      pointer.x = event.clientX - box.left;
      pointer.y = event.clientY - box.top;
      pointer.active = true;
    };
    const onMove = (event: PointerEvent) => position(event);
    const onLeave = () => { pointer.active = false; };
    const onDown = (event: PointerEvent) => {
      if (reduceMotion) return;
      position(event);
      const strength = mode === "logo" ? 14 : 4;
      for (const dot of dots) {
        const dx = dot.x - pointer.x;
        const dy = dot.y - pointer.y;
        const distance = Math.hypot(dx, dy) || 1;
        if (distance < 170) {
          const push = (1 - distance / 170) * strength;
          if (mode === "logo") { dot.vx += (dx / distance) * push; dot.vy += (dy / distance) * push; }
          else { dot.bx += (dx / distance) * push; dot.by += (dy / distance) * push; }
        }
      }
    };
    host.addEventListener("pointermove", onMove);
    host.addEventListener("pointerleave", onLeave);
    host.addEventListener("pointerdown", onDown);

    const resize = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(build);
    resize?.observe(canvas);
    const watch = typeof IntersectionObserver === "undefined" ? null : new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; wake(); });
    watch?.observe(canvas);
    build();
    wake();

    return () => {
      cancelAnimationFrame(frame);
      resize?.disconnect();
      watch?.disconnect();
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
      host.removeEventListener("pointerdown", onDown);
    };
  }, [mode]);

  return <canvas ref={canvasRef} aria-hidden="true" className={className} />;
}
