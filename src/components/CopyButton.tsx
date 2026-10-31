"use client";

import { useEffect, useState } from "react";

/** Copies `value` to the clipboard and says so. If the browser blocks copying, it tells the visitor to copy it themselves. */
export function CopyButton({ value, label = "Copy" }: { value: string; label?: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");

  useEffect(() => {
    if (state === "idle") return;
    const timer = window.setTimeout(() => setState("idle"), 2200);
    return () => window.clearTimeout(timer);
  }, [state]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setState("copied");
    } catch {
      setState("failed");
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={copy}
        className="inline-flex min-h-11 shrink-0 items-center rounded-full border border-accent bg-transparent px-5 text-sm font-semibold text-accent transition duration-300 hover:bg-accent hover:text-paper focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
      >
        {state === "copied" ? "Copied" : label}
      </button>
      <span role="status" className="sr-only">{state === "copied" ? "Copied to the clipboard" : state === "failed" ? "Could not copy. Select the address and copy it yourself." : ""}</span>
    </>
  );
}
