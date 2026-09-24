"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

const REFRESH_MS = 30_000;

/** Re-fetches the server-rendered dashboard on a timer while the tab is visible, and once when it becomes visible again. */
export function AutoRefresh({ intervalMs = REFRESH_MS }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === "visible") router.refresh();
    };

    const timer = window.setInterval(refresh, intervalMs);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [router, intervalMs]);

  return <p className="text-xs text-muted">Updates automatically every {Math.round(intervalMs / 1000)} seconds.</p>;
}
