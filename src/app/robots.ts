import type { MetadataRoute } from "next";

import { siteUrl } from "@/lib/site";

// Evaluated per request so the Sitemap line always uses the live domain, never a build-time fallback.
export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api/"] }],
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
