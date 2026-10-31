/**
 * @jest-environment node
 */
import sitemap from "@/app/sitemap";
import { listBlogPosts } from "@/lib/content/blog";
import { listProjects } from "@/lib/content/repository";

jest.mock("@/lib/content/blog", () => ({ listBlogPosts: jest.fn() }));
jest.mock("@/lib/content/repository", () => ({ listProjects: jest.fn() }));
jest.mock("@/lib/analytics/report", () => ({ withReportedFallback: (query: Promise<unknown[]>) => query.catch(() => []) }));

describe("sitemap", () => {
  it("lists posts and projects", async () => {
    jest.mocked(listBlogPosts).mockResolvedValue([{ slug: "hello", title: "Hello", date: "2026-09-01", summary: "", tags: [], status: "published", readingMinutes: 1 }]);
    jest.mocked(listProjects).mockResolvedValue([{ slug: "alpha", title: "A", year: "2026", summary: "", role: "", outcomes: [] }]);

    const urls = (await sitemap()).map((entry) => entry.url);

    expect(urls).toEqual(expect.arrayContaining([expect.stringContaining("/blog/hello"), expect.stringContaining("/projects/alpha")]));
  });

  it("still serves the fixed pages when posts and projects cannot be read", async () => {
    jest.mocked(listBlogPosts).mockRejectedValue(new Error("fetch failed"));
    jest.mocked(listProjects).mockRejectedValue(new Error("fetch failed"));

    const urls = (await sitemap()).map((entry) => entry.url);

    expect(urls.some((url) => url.endsWith("/blog"))).toBe(true);
    expect(urls.some((url) => url.includes("/blog/hello"))).toBe(false);
  });
});
