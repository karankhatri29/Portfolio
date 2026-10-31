/**
 * @jest-environment node
 */
import { reportServerError } from "@/lib/analytics/report";
import { listBlogPosts } from "@/lib/content/blog";

import { GET } from "./route";

jest.mock("@/lib/content/blog", () => ({ listBlogPosts: jest.fn() }));
jest.mock("@/lib/analytics/report", () => ({ reportServerError: jest.fn() }));

const mockList = jest.mocked(listBlogPosts);

describe("/feed.xml", () => {
  it("serves the published posts as RSS", async () => {
    mockList.mockResolvedValue([{ slug: "hello", title: "Hello", date: "2026-09-01", summary: "Hi", tags: [], status: "published", readingMinutes: 1 }]);

    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/rss+xml");
    expect(await response.text()).toContain("<title>Hello</title>");
  });

  it("answers 503 with Retry-After, never an empty feed, when the database is down", async () => {
    mockList.mockRejectedValue(new Error("fetch failed"));

    const response = await GET();

    expect(response.status).toBe(503);
    expect(response.headers.get("retry-after")).toBe("300");
    expect(reportServerError).toHaveBeenCalledWith(expect.any(Error), "/feed.xml");
  });
});
