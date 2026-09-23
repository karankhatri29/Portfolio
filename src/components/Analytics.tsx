"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const ENTRY_KEY = "portfolio-analytics-entry";
const SEEN_KEY = "portfolio-analytics-seen";
const MAX_SECONDS = 1800;

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

// A single yes/no flag ("this browser has visited before"), never an identifier.
function isReturningBrowser() {
  try {
    const seen = localStorage.getItem(SEEN_KEY) === "1";
    localStorage.setItem(SEEN_KEY, "1");
    return seen;
  } catch {
    return false;
  }
}

function scrollPercent() {
  const total = document.documentElement.scrollHeight - window.innerHeight;
  if (total <= 0) return 100;
  return Math.min(100, Math.max(0, Math.round((window.scrollY / total) * 100)));
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
      returning: isEntry ? isReturningBrowser() : false,
      referrer: isEntry ? document.referrer : "",
      ref: isEntry ? new URLSearchParams(window.location.search).get("ref") ?? "" : "",
    });

    // Reading time counts only while the tab is visible and is reported once, when the
    // reader first hides the tab, leaves the page or navigates to another route.
    let visibleSince: number | null = document.visibilityState === "visible" ? Date.now() : null;
    let activeMs = 0;
    let maxScroll = scrollPercent();
    let reported = false;

    function pause() {
      if (visibleSince !== null) {
        activeMs += Date.now() - visibleSince;
        visibleSince = null;
      }
    }

    function report() {
      if (reported) return;
      reported = true;
      pause();
      maxScroll = Math.max(maxScroll, scrollPercent());
      const seconds = Math.min(MAX_SECONDS, Math.round(activeMs / 1000));
      if (seconds >= 1) send({ type: "engagement", path: pathname, duration: seconds, scroll: maxScroll });
    }

    function onVisibility() {
      if (document.visibilityState === "hidden") report();
      else if (!reported) visibleSince = Date.now();
    }

    function onScroll() {
      maxScroll = Math.max(maxScroll, scrollPercent());
    }

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", report);
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      report();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", report);
      window.removeEventListener("scroll", onScroll);
    };
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
