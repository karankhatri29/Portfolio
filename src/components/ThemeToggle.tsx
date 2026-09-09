"use client";

import { useState } from "react";
import { useTheme } from "next-themes";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [pendingTheme, setPendingTheme] = useState<"dark" | "light" | null>(null);
  const isLight = (pendingTheme ?? theme) === "light";

  return (
    <button
      type="button"
      className={`rounded-full border border-ink/20 px-3 py-2 text-sm font-semibold text-ink transition hover:border-accent hover:text-accent ${className}`}
      aria-label={isLight ? "Switch to dark theme" : "Switch to light theme"}
      aria-pressed={isLight}
      onClick={() => {
        const nextThemeIsLight = !isLight;
        const nextTheme = nextThemeIsLight ? "light" : "dark";
        setPendingTheme(nextTheme);
        setTheme(nextTheme);
      }}
    >
      {isLight ? "Dark" : "Light"}
    </button>
  );
}
