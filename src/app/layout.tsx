import type { Metadata } from "next";

import "./globals.css";
import { Analytics } from "@/components/Analytics";
import { ClientErrors } from "@/components/ClientErrors";
import { Providers } from "@/components/Providers";
import { portfolioContent } from "@/data/portfolio";
import { SITE_NAME, siteUrl } from "@/lib/site";

const role = portfolioContent.headline.split(".")[0];

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: `${SITE_NAME} | ${role}`, template: `%s | ${SITE_NAME}` },
  description: portfolioContent.summary,
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME }],
  openGraph: { type: "website", siteName: SITE_NAME, locale: "en_US" },
  twitter: { card: "summary_large_image" },
  alternates: { types: { "application/rss+xml": "/feed.xml" } },
  robots: { index: true, follow: true },
};


export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
        <Analytics />
        <ClientErrors />
      </body>
    </html>
  );
}
