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

  return [
    { url: base, changeFrequency: "monthly", priority: 1 },
    { url: `${base}/blog`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/resume`, changeFrequency: "monthly", priority: 0.7 },
    ...projects.map((project) => ({ url: `${base}/projects/${project.slug}`, changeFrequency: "monthly" as const, priority: 0.7 })),
    ...posts.map((post) => ({ url: `${base}/blog/${post.slug}`, lastModified: parsedDate(post.date), changeFrequency: "yearly" as const, priority: 0.6 })),
    { url: `${base}/privacy`, changeFrequency: "yearly", priority: 0.2 },
  ];
}
