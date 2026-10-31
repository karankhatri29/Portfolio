import { portfolioContent } from "@/data/portfolio";
import { reportServerError } from "@/lib/analytics/report";
import { listBlogPosts } from "@/lib/content/blog";
import { buildFeed } from "@/lib/feed";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function GET() {
  // An empty feed would look like every post was deleted to feed readers, so tell them to come back later instead.
  const posts = await listBlogPosts().catch(async (error: unknown) => {
    await reportServerError(error, "/feed.xml");
    return null;
  });
  if (!posts) return new Response("Feed temporarily unavailable", { status: 503, headers: { "retry-after": "300", "cache-control": "no-store" } });

  const xml = buildFeed({
    siteUrl: siteUrl(),
    title: `${portfolioContent.name} - Writing and research`,
    description: portfolioContent.summary,
    posts,
  });

  return new Response(xml, { headers: { "content-type": "application/rss+xml; charset=utf-8", "cache-control": "public, max-age=0, s-maxage=3600" } });
}
