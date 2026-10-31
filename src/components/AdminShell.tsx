import Link from "next/link";
import type { ReactNode } from "react";

import { BrandMark } from "@/components/BrandMark";

export type AdminSection = "content" | "blog" | "analytics";

// "label" is what is shown; "name" is the longer name assistive technology announces.
const SECTIONS: { id: AdminSection; label: string; name: string; href: string }[] = [
  { id: "content", label: "Content", name: "Manage content", href: "/admin" },
  { id: "blog", label: "Blog", name: "Write blog posts", href: "/admin/blog" },
  { id: "analytics", label: "Analytics", name: "View analytics", href: "/admin/analytics" },
];

/** The frame shared by every admin page: a slim bar with the three sections, then the page title and content. */
export function AdminShell({ current, title, description, signedIn, wide, children }: { current: AdminSection; title: string; description?: string; signedIn: boolean; wide?: boolean; children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-ink/10 bg-paper/75 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-5 lg:px-8">
          <Link href="/" className="flex shrink-0 items-center rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"><BrandMark size={36} title="Back to the site" /></Link>
          {signedIn ? (
            <nav aria-label="Admin sections" className="flex min-w-0 gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {SECTIONS.map((section) => (
                <Link
                  key={section.id}
                  href={section.href}
                  aria-label={section.name}
                  aria-current={current === section.id ? "page" : undefined}
                  className={`flex min-h-11 shrink-0 items-center rounded-full px-4 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${current === section.id ? "bg-accent/15 text-accent" : "text-muted hover:text-ink"}`}
                >
                  {section.label}
                </Link>
              ))}
            </nav>
          ) : <span className="text-sm text-muted">Admin</span>}
          <Link href="/" className="ml-auto flex min-h-11 shrink-0 items-center text-sm text-muted transition hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">View site</Link>
        </div>
      </header>

      <main className={`mx-auto px-5 py-12 lg:px-8 lg:py-16 ${wide ? "max-w-6xl" : "max-w-5xl"}`}>
        <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">{title}</h1>
        {description ? <p className="mt-3 max-w-2xl leading-7 text-muted">{description}</p> : null}
        <div className="mt-10">{children}</div>
      </main>
    </div>
  );
}
