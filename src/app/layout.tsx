import type { Metadata } from "next";

import "./globals.css";
import { Analytics } from "@/components/Analytics";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: "Karan | Portfolio",
  description: "A personal portfolio of product systems, experiments, and research notes.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
        <Analytics />
      </body>
    </html>
  );
}
