"use client";

import { useEffect } from "react";

import { reportClientError } from "@/lib/client-error";

type GlobalErrorProps = { error: Error & { digest?: string }; retry?: () => void; reset?: () => void };

// Replaces the whole document, so it cannot rely on the app's stylesheet.
export default function GlobalError({ error, retry, reset }: GlobalErrorProps) {
  useEffect(() => {
    reportClientError(error, error.digest);
  }, [error]);

  const tryAgain = retry ?? reset;

  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#131918", color: "#ecece8", fontFamily: "system-ui, sans-serif" }}>
        <main style={{ maxWidth: 640, margin: "0 auto", padding: "96px 24px" }}>
          <p style={{ color: "#f6b84c", letterSpacing: "0.2em", textTransform: "uppercase", fontSize: 14, fontWeight: 600 }}>Something went wrong</p>
          <h1 style={{ fontSize: 40, margin: "16px 0" }}>The site hit an unexpected error.</h1>
          <p style={{ color: "#a6aea8", lineHeight: 1.7 }}>It has been logged. Please try again in a moment.</p>
          {tryAgain ? (
            <button type="button" onClick={() => tryAgain()} style={{ marginTop: 24, padding: "10px 20px", background: "transparent", color: "#f6b84c", border: "1px solid #f6b84c", fontWeight: 600, cursor: "pointer" }}>
              Try again
            </button>
          ) : null}
        </main>
      </body>
    </html>
  );
}
