import { portfolioContent } from "@/data/portfolio";

export const SITE_NAME = portfolioContent.name;

// NEXT_PUBLIC_SITE_URL wins; on Vercel the production domain is exposed automatically.
export function siteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return configured.replace(/\/+$/, "");

  const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercelHost) return `https://${vercelHost.replace(/^https?:\/\//, "").replace(/\/+$/, "")}`;

  return "http://localhost:3000";
}

export function absoluteUrl(path: string): string {
  return `${siteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

export function socialProfiles(): string[] {
  return portfolioContent.contactLinks.filter((link) => link.href.startsWith("http")).map((link) => link.href);
}
