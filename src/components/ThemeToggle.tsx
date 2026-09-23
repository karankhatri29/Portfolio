"use client";

import { useState, useSyncExternalStore } from "react";
import { useTheme } from "next-themes";

const subscribeToNothing = () => () => {};

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [pendingTheme, setPendingTheme] = useState<"dark" | "light" | null>(null);
  // false while rendering on the server and during hydration, true afterwards. The server cannot know the
  // visitor's saved theme, so both must render the same neutral toggle first or React rebuilds the whole page.
  const mounted = useSyncExternalStore(subscribeToNothing, () => true, () => false);
  const isLight = mounted && (pendingTheme ?? theme) === "light";

  return (
    <button
      type="button"
      className={`flex items-center gap-2 rounded-full border border-ink/20 p-2.5 text-sm font-semibold text-ink transition hover:border-accent hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:px-3 sm:py-2 ${className}`}
      aria-label={!mounted ? "Toggle theme" : isLight ? "Switch to dark theme" : "Switch to light theme"}
      aria-pressed={mounted ? isLight : undefined}
      onClick={() => {
        const nextTheme = isLight ? "dark" : "light";
        setPendingTheme(nextTheme);
        setTheme(nextTheme);
      }}
    >
      <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 sm:hidden">
        {isLight ? <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" /> : <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4m11.4-11.4 1.4-1.4" /></>}
      </svg>
      <span className="hidden sm:inline">{isLight ? "Dark" : "Light"}</span>
    </button>
  );
}
