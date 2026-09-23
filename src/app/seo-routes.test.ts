/**
 * @jest-environment node
 */
import { listProjects } from "@/lib/content/repository";

import { GET as feed } from "./feed.xml/route";
import robots from "./robots";
import sitemap from "./sitemap";

jest.mock("@/lib/content/repository", () => ({ listProjects: jest.fn() }));
jest.mock("@/lib/content/blog", () => ({
  listBlogPosts: async () => [{ slug: "hello", title: "Hello", summary: "Hi", date: "2026-09-01" }, { slug: "odd", title: "Odd", summary: "s", date: "not a date" }],
}));

const mockProjects = jest.mocked(listProjects);
const env = process.env as Record<string, string | undefined>;

beforeEach(() => {
  env.NEXT_PUBLIC_SITE_URL = "https://karan.dev";
});

describe("robots", () => {
  it("allows the public site, hides admin and api, and points to the sitemap", () => {
    expect(robots()).toEqual({ rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api/"] }], sitemap: "https://karan.dev/sitemap.xml" });
  });
});

describe("sitemap", () => {
  it("lists static pages, projects and posts with absolute URLs", async () => {
    mockProjects.mockResolvedValue([{ slug: "alpha", title: "Alpha", year: "2026", summary: "s", role: "r", outcomes: ["o"] }]);

    const urls = (await sitemap()).map((entry) => entry.url);

    expect(urls).toEqual(expect.arrayContaining(["https://karan.dev", "https://karan.dev/blog", "https://karan.dev/resume", "https://karan.dev/projects/alpha", "https://karan.dev/blog/hello", "https://karan.dev/privacy"]));
    expect(urls.some((url) => url.includes("/admin") || url.includes("/api"))).toBe(false);
  });

  it("uses valid post dates only and survives a database outage", async () => {
    mockProjects.mockRejectedValue(new Error("db down"));

    const entries = await sitemap();
    const hello = entries.find((entry) => entry.url.endsWith("/blog/hello"));
    const odd = entries.find((entry) => entry.url.endsWith("/blog/odd"));

    expect(hello?.lastModified).toEqual(new Date("2026-09-01"));
    expect(odd?.lastModified).toBeUndefined();
    expect(entries.some((entry) => entry.url.includes("/projects/"))).toBe(false);
  });
});

describe("feed.xml", () => {
  it("serves RSS with the right content type", async () => {
    const response = await feed();

    expect(response.headers.get("content-type")).toBe("application/rss+xml; charset=utf-8");
    expect(await response.text()).toContain("<link>https://karan.dev/blog/hello</link>");
  });
});
