"use client";

import Link from "next/link";
import { useEffect } from "react";

import { reportClientError } from "@/lib/client-error";

type ErrorProps = { error: Error & { digest?: string }; retry?: () => void; reset?: () => void };

export default function ErrorPage({ error, retry, reset }: ErrorProps) {
  useEffect(() => {
    reportClientError(error, error.digest);
  }, [error]);

  const tryAgain = retry ?? reset;

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-2xl flex-col justify-center px-5 py-24 lg:px-8">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">Something went wrong</p>
      <h1 className="mt-4 font-display text-5xl font-semibold tracking-tight">This page hit a snag.</h1>
      <p className="mt-6 text-lg leading-8 text-muted">It has been logged and I will take a look. You can try again, or head back to the home page.</p>
      <div className="mt-10 flex flex-wrap gap-4">
        {tryAgain ? <button type="button" onClick={() => tryAgain()} className="border border-accent px-5 py-2 text-sm font-semibold text-accent focus:outline-none focus:ring-2 focus:ring-accent">Try again</button> : null}
        <Link href="/" className="px-5 py-2 text-sm font-semibold underline underline-offset-4 focus:outline-none focus:ring-2 focus:ring-accent">Back to home</Link>
      </div>
    </main>
  );
}
