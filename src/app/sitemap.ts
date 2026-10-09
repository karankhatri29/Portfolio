import type { MetadataRoute } from "next";

import { listBlogPosts } from "@/lib/content/blog";
import { listProjects } from "@/lib/content/repository";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

function parsedDate(value: string): Date | undefined {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const posts = await listBlogPosts();
  // The sitemap must still work if the database is briefly unreachable.
  const projects = await listProjects().catch(() => []);

  // Google ignores priority and changefreq, and only trusts lastmod when it is verifiably accurate,
  // so only posts (which have a real publish date) carry one.
  return [
    { url: base },
    { url: `${base}/blog` },
    { url: `${base}/resume` },
    ...projects.map((project) => ({ url: `${base}/projects/${project.slug}` })),
    ...posts.map((post) => ({ url: `${base}/blog/${post.slug}`, lastModified: parsedDate(post.date) })),
    { url: `${base}/privacy` },
  ];
}
