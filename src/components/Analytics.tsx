"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const ENTRY_KEY = "portfolio-analytics-entry";

function send(payload: Record<string, unknown>) {
  const body = JSON.stringify(payload);

  try {
    if (navigator.sendBeacon?.("/api/track", body)) return;
    void fetch("/api/track", { method: "POST", body, keepalive: true });
  } catch {
    // Analytics must never affect the page.
  }
}

function isFirstPageOfSession() {
  try {
    if (sessionStorage.getItem(ENTRY_KEY)) return false;
    sessionStorage.setItem(ENTRY_KEY, "1");
  } catch {
    // Storage blocked: treat every page as a non-entry so referrers are not over-counted.
    return false;
  }
  return true;
}

export function Analytics() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname.startsWith("/admin")) return;

    const isEntry = isFirstPageOfSession();
    send({
      type: "pageview",
      path: pathname,
      isEntry,
      referrer: isEntry ? document.referrer : "",
      ref: isEntry ? new URLSearchParams(window.location.search).get("ref") ?? "" : "",
    });
  }, [pathname]);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      const link = (event.target as Element | null)?.closest?.("a[data-track]");
      const target = link?.getAttribute("data-track");
      if (target) send({ type: "click", path: window.location.pathname, target });
    }

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return null;
}
