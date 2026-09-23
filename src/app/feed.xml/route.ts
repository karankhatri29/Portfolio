import { portfolioContent } from "@/data/portfolio";
import { listBlogPosts } from "@/lib/content/blog";
import { buildFeed } from "@/lib/feed";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function GET() {
  const posts = await listBlogPosts();
  const xml = buildFeed({
    siteUrl: siteUrl(),
    title: `${portfolioContent.name} - Writing and research`,
    description: portfolioContent.summary,
    posts,
  });

  return new Response(xml, { headers: { "content-type": "application/rss+xml; charset=utf-8", "cache-control": "public, max-age=0, s-maxage=3600" } });
}
