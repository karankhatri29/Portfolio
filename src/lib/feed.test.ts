import { buildFeed, escapeXml } from "@/lib/feed";

describe("escapeXml", () => {
  it("escapes the five XML special characters", () => {
    expect(escapeXml(`<a href="x">Tom & 'Jerry'</a>`)).toBe("&lt;a href=&quot;x&quot;&gt;Tom &amp; &apos;Jerry&apos;&lt;/a&gt;");
  });
});

describe("buildFeed", () => {
  const posts = [
    { slug: "first", title: "First & Best", summary: "About <things>", date: "2026-09-01" },
    { slug: "undated", title: "No date", summary: "s", date: "" },
  ];

  it("produces an RSS 2.0 document with escaped, linked items", () => {
    const xml = buildFeed({ siteUrl: "https://karan.dev", title: "Karan", description: "Notes", posts });

    expect(xml).toContain('<rss version="2.0"');
    expect(xml).toContain("<title>First &amp; Best</title>");
    expect(xml).toContain("<description>About &lt;things&gt;</description>");
    expect(xml).toContain("<link>https://karan.dev/blog/first</link>");
    expect(xml).toContain('<atom:link href="https://karan.dev/feed.xml"');
    expect(xml).toContain("<pubDate>Tue, 01 Sep 2026 00:00:00 GMT</pubDate>");
  });

  it("omits pubDate for posts without a valid date and works with no posts", () => {
    const xml = buildFeed({ siteUrl: "https://karan.dev", title: "Karan", description: "Notes", posts });
    const undated = xml.split("<item>")[2];

    expect(undated).not.toContain("<pubDate>");
    expect(buildFeed({ siteUrl: "https://karan.dev", title: "t", description: "d", posts: [] })).not.toContain("<item>");
  });
});
