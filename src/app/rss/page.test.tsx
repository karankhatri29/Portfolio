import { render, screen } from "@testing-library/react";

import { listBlogPosts } from "@/lib/content/blog";

import RssPage from "./page";

jest.mock("@/lib/content/blog", () => ({ listBlogPosts: jest.fn() }));
jest.mock("@/lib/site", () => ({ siteUrl: () => "https://karan.dev" }));

const mockPosts = jest.mocked(listBlogPosts);

describe("RSS page", () => {
  it("explains RSS, shows the feed address and lists the latest posts", async () => {
    mockPosts.mockResolvedValue([{ slug: "hello", title: "Hello", summary: "Hi there", date: "2026-09-01" }] as never);

    render(await RssPage());

    expect(screen.getByRole("heading", { level: 1, name: "Follow by RSS" })).toBeInTheDocument();
    expect(screen.getByText("https://karan.dev/feed.xml")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy address" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Hello" })).toHaveAttribute("href", "/blog/hello");
  });

  it("still works, and says there are no posts yet, when the posts cannot be loaded", async () => {
    mockPosts.mockRejectedValue(new Error("database unavailable"));

    render(await RssPage());

    expect(screen.getByText(/No posts yet/)).toBeInTheDocument();
    expect(screen.getByText("https://karan.dev/feed.xml")).toBeInTheDocument();
  });
});
