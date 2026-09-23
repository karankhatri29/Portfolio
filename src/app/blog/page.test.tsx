import { render, screen, within } from "@testing-library/react";

import BlogIndexPage from "@/app/blog/page";
import { listBlogPosts } from "@/lib/content/blog";

jest.mock("@/lib/content/blog", () => ({ listBlogPosts: jest.fn() }));

const mockList = jest.mocked(listBlogPosts);

const posts = [
  { slug: "newer", title: "Newer Post", date: "2026-09-01", summary: "Fresh.", tags: ["ai", "nlp"], status: "published" as const, readingMinutes: 4 },
  { slug: "older", title: "Older Post", date: "2025-12-10", summary: "Classic.", tags: ["ai"], status: "published" as const, readingMinutes: 1 },
  { slug: "untagged", title: "Untagged Post", date: "2025-01-02", summary: "Plain.", tags: [], status: "published" as const, readingMinutes: 2 },
];

const renderIndex = async (tag?: string) => render(await BlogIndexPage({ searchParams: Promise.resolve({ tag }) }));

beforeEach(() => mockList.mockResolvedValue(posts));

describe("blog index", () => {
  it("lists posts with formatted date, reading time and links", async () => {
    await renderIndex();

    expect(screen.getByRole("heading", { level: 1, name: /writing and research/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Newer Post" })).toHaveAttribute("href", "/blog/newer");
    expect(screen.getByText("Sep 1, 2026")).toHaveAttribute("datetime", "2026-09-01");
    expect(screen.getByText(/4 min read/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /RSS/ })).toHaveAttribute("href", "/feed.xml");
  });

  it("offers a tag filter built from the posts and filters by the chosen tag", async () => {
    await renderIndex("nlp");

    const filter = screen.getByRole("navigation", { name: "Filter by tag" });
    expect(within(filter).getAllByRole("link").map((link) => link.textContent)).toEqual(["All", "ai", "nlp"]);
    expect(within(filter).getByRole("link", { name: "nlp" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Newer Post" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Older Post" })).not.toBeInTheDocument();
  });

  it("says so when a tag has no posts or when there are no posts at all", async () => {
    const { unmount } = await renderIndex("missing");
    expect(screen.getByText('No posts tagged "missing" yet.')).toBeInTheDocument();
    unmount();

    mockList.mockResolvedValue([]);
    await renderIndex();
    expect(screen.getByText("New writing is on the way.")).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Filter by tag" })).not.toBeInTheDocument();
  });
});
