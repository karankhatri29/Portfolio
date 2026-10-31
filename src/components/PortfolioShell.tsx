import type { PortfolioSession } from "@/lib/auth/types";
import { portfolioContent } from "@/data/portfolio";
import { SiteHeader } from "@/components/SiteHeader";
import { ContactFooter } from "@/components/ContactFooter";

export function PortfolioShell({ children, session }: { children: React.ReactNode; session: PortfolioSession | null }) {
  return (
    <div className="min-h-screen overflow-x-clip text-ink">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-10 focus:bg-accent focus:px-4 focus:py-2 focus:text-paper">
        Skip to content
      </a>
      <SiteHeader
        name={portfolioContent.name}
        links={[...portfolioContent.navigation.map((item) => ({ label: item, href: `#${item.toLowerCase()}` })), { label: "Resume", href: "/resume" }]}
        session={session}
      />
      <main id="main-content">{children}</main>
      <div className="mx-auto max-w-6xl px-5 lg:px-8"><ContactFooter links={portfolioContent.contactLinks} name={portfolioContent.name} /></div>
    </div>
  );
}
