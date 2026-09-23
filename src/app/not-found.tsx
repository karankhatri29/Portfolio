import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Page not found", robots: { index: false } };

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-2xl flex-col justify-center px-5 py-24 lg:px-8">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">404</p>
      <h1 className="mt-4 font-display text-5xl font-semibold tracking-tight">That page does not exist.</h1>
      <p className="mt-6 text-lg leading-8 text-muted">The link may be old or mistyped. These will get you back on track.</p>
      <nav aria-label="Helpful links" className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm font-semibold">
        <Link href="/" className="text-accent underline underline-offset-4">Home</Link>
        <Link href="/#projects" className="text-accent underline underline-offset-4">Projects</Link>
        <Link href="/blog" className="text-accent underline underline-offset-4">Writing</Link>
        <Link href="/#contact" className="text-accent underline underline-offset-4">Contact</Link>
      </nav>
    </main>
  );
}
