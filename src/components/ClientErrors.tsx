"use client";

import { useEffect } from "react";

import { reportClientError } from "@/lib/client-error";

const MAX_PER_PAGE_LOAD = 5;

export function ClientErrors() {
  useEffect(() => {
    const seen = new Set<string>();

    function report(error: unknown, message: string) {
      if (seen.size >= MAX_PER_PAGE_LOAD || seen.has(message)) return;
      seen.add(message);
      reportClientError(error);
    }

    function onError(event: ErrorEvent) {
      report(event.error ?? new Error(event.message), event.message);
    }

    function onRejection(event: PromiseRejectionEvent) {
      const reason = event.reason;
      report(reason, reason instanceof Error ? reason.message : String(reason));
    }

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
