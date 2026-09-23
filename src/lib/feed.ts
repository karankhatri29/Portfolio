export type FeedPost = { slug: string; title: string; summary: string; date: string };

export function escapeXml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

function rfc822(date: string): string | null {
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toUTCString();
}

export function buildFeed({ siteUrl, title, description, posts }: { siteUrl: string; title: string; description: string; posts: FeedPost[] }): string {
  const items = posts.map((post) => {
    const link = `${siteUrl}/blog/${post.slug}`;
    const published = rfc822(post.date);

    return [
      "    <item>",
      `      <title>${escapeXml(post.title)}</title>`,
      `      <link>${escapeXml(link)}</link>`,
      `      <guid isPermaLink="true">${escapeXml(link)}</guid>`,
      published ? `      <pubDate>${published}</pubDate>` : null,
      `      <description>${escapeXml(post.summary)}</description>`,
      "    </item>",
    ]
      .filter((line): line is string => line !== null)
      .join("\n");
  });

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    "  <channel>",
    `    <title>${escapeXml(title)}</title>`,
    `    <link>${escapeXml(siteUrl)}/blog</link>`,
    `    <description>${escapeXml(description)}</description>`,
    `    <atom:link href="${escapeXml(siteUrl)}/feed.xml" rel="self" type="application/rss+xml" />`,
    ...items,
    "  </channel>",
    "</rss>",
    "",
  ].join("\n");
}
