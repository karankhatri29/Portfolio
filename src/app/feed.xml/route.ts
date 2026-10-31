import { portfolioContent } from "@/data/portfolio";
import { listBlogPosts } from "@/lib/content/blog";
import { buildFeed } from "@/lib/feed";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function GET() {
  // If the posts cannot be loaded (for example the database is briefly down) the feed is still valid, just empty,
  // and it is not cached, so the next request tries again instead of serving an empty feed for an hour.
  let posts: Awaited<ReturnType<typeof listBlogPosts>> = [];
  let loaded = true;
  try {
    posts = await listBlogPosts();
  } catch {
    loaded = false;
  }
  const xml = buildFeed({
    siteUrl: siteUrl(),
    title: `${portfolioContent.name} - Writing and research`,
    description: portfolioContent.summary,
    posts,
  });

  return new Response(xml, { headers: { "content-type": "application/rss+xml; charset=utf-8", "cache-control": loaded ? "public, max-age=0, s-maxage=3600" : "no-store" } });
}
