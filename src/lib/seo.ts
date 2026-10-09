import { portfolioContent } from "@/data/portfolio";
import { SITE_NAME, absoluteUrl, siteUrl } from "@/lib/site";

export function personRef() {
  return { "@type": "Person", "@id": `${siteUrl()}/#person`, name: SITE_NAME, url: siteUrl() };
}

export function publisherRef() {
  return { ...personRef(), image: absoluteUrl("/karan-khatri.png") };
}

export function breadcrumbs(trail: { name: string; path: string }[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [{ name: "Home", path: "/" }, ...trail].map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function websiteSchema(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteUrl()}/#website`,
    name: SITE_NAME,
    url: siteUrl(),
    description: portfolioContent.summary,
    inLanguage: "en",
    publisher: { "@id": `${siteUrl()}/#person` },
  };
}
