"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

import { AuthControls } from "@/components/AuthControls";
import { BrandMark } from "@/components/BrandMark";
import type { PortfolioSession } from "@/lib/auth/types";

/**
 * One header with a fixed height and exactly two layouts, so nothing reflows between them:
 * - large screens (lg and up): logo left, navigation centred, account right, all on a single row;
 * - smaller screens: logo left, account and a menu button right, with the navigation in a panel below the bar.
 * It never wraps onto a second line, at any width.
 */
export function SiteHeader({ name, links, session }: { name: string; links: { label: string; href: string }[]; session: PortfolioSession | null }) {
  const [open, setOpen] = useState(false);
  // Transparent over the top of the page, frosted once content scrolls underneath it.
  const [scrolled, setScrolled] = useState(false);
  const panelId = useId();
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 8);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  // Escape or a click outside closes the menu, and growing to the desktop layout resets it.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    const onPointer = (event: PointerEvent) => { if (root.current && !root.current.contains(event.target as Node)) setOpen(false); };
    const wide = window.matchMedia?.("(min-width: 1024px)");
    const onResize = () => wide?.matches && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    wide?.addEventListener?.("change", onResize);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
      wide?.removeEventListener?.("change", onResize);
    };
  }, [open]);

  const link = "flex min-h-12 items-center px-5 text-base text-ink/90 transition hover:text-accent focus:outline-none focus-visible:text-accent lg:min-h-0 lg:px-0 lg:text-sm lg:text-muted";

  return (
    <header ref={root} className={`sticky top-0 z-40 border-b transition-[background-color,border-color,backdrop-filter] duration-300 motion-reduce:transition-none ${scrolled || open ? "border-ink/10 bg-paper/75 backdrop-blur-md" : "border-transparent bg-transparent"}`}>
      <div className="mx-auto grid h-16 max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 lg:h-20 lg:grid-cols-[1fr_auto_1fr] lg:px-8">
        {/* Logo only. The name stays as the logo's accessible name, so assistive technology still announces it. */}
        <Link href="/" className="flex w-fit items-center rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">
          <BrandMark size={48} title={name} />
        </Link>

        <nav
          id={panelId}
          aria-label="Primary navigation"
          className={`${open ? "flex" : "hidden"} absolute inset-x-0 top-full flex-col border-b border-ink/10 bg-paper/95 py-2 shadow-2xl shadow-black/40 backdrop-blur-md lg:static lg:flex lg:flex-row lg:items-center lg:gap-8 lg:border-0 lg:bg-transparent lg:py-0 lg:shadow-none lg:backdrop-blur-none`}
        >
          {links.map((item) => item.href.startsWith("/")
            ? <Link key={item.label} href={item.href} onClick={() => setOpen(false)} className={link}>{item.label}</Link>
            : <a key={item.label} href={item.href} onClick={() => setOpen(false)} className={link}>{item.label}</a>)}
        </nav>

        <div className="flex items-center justify-end gap-2 lg:col-start-3">
          <AuthControls session={session} />
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls={panelId}
            onClick={() => setOpen((value) => !value)}
            className="flex h-11 w-11 shrink-0 items-center justify-center border border-ink/20 text-ink transition hover:border-accent hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent lg:hidden"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="h-5 w-5">
              {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
