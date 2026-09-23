"use client";

import { useState } from "react";

const linkClass = "border border-ink/20 px-3 py-1.5 text-xs font-semibold transition hover:border-accent hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent";

export function ShareLinks({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const encodedUrl = encodeURIComponent(url);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Share this post">
      <span className="mr-1 text-xs font-semibold uppercase tracking-[0.16em] text-muted">Share</span>
      <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`} target="_blank" rel="noopener noreferrer" className={linkClass}>LinkedIn</a>
      <a href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodeURIComponent(title)}`} target="_blank" rel="noopener noreferrer" className={linkClass}>X</a>
      <button type="button" onClick={copy} className={linkClass}>{copied ? "Link copied" : "Copy link"}</button>
      <span role="status" className="sr-only">{copied ? "Link copied to clipboard" : ""}</span>
    </div>
  );
}
