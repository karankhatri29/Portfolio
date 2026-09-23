import Link from "next/link";

import type { PortfolioSession } from "@/lib/auth/types";
import { portfolioContent } from "@/data/portfolio";
import { AuthControls } from "@/components/AuthControls";
import { ContactFooter } from "@/components/ContactFooter";
import { ThemeToggle } from "@/components/ThemeToggle";

export function PortfolioShell({ children, session }: { children: React.ReactNode; session: PortfolioSession | null }) {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-10 focus:bg-accent focus:px-4 focus:py-2 focus:text-paper">
        Skip to content
      </a>
      <header className="border-b border-ink/10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-5 lg:px-8">
          <Link href="/" className="font-display text-xl font-semibold tracking-tight">{portfolioContent.name}</Link>
          <nav aria-label="Primary navigation" className="order-3 flex w-full gap-5 text-sm text-muted sm:order-2 sm:w-auto">
            {portfolioContent.navigation.map((item) => <a key={item} href={`#${item.toLowerCase()}`} className="hover:text-accent">{item}</a>)}
          </nav>
          <div className="flex items-center gap-3 sm:order-3">
            <ThemeToggle />
            <AuthControls session={session} />
          </div>
        </div>
      </header>
      <main id="main-content">{children}</main>
      <div className="mx-auto max-w-6xl px-5 lg:px-8"><ContactFooter links={portfolioContent.contactLinks} name={portfolioContent.name} /></div>
    </div>
  );
}
