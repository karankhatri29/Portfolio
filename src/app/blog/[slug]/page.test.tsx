import { render, screen, within } from "@testing-library/react";

import BlogPostPage, { generateMetadata } from "@/app/blog/[slug]/page";
import { auth } from "@/auth";
import { getBlogPost, listBlogPosts } from "@/lib/content/blog";

jest.mock("@/auth", () => ({ auth: jest.fn() }));
jest.mock("@/lib/content/blog", () => ({ getBlogPost: jest.fn(), listBlogPosts: jest.fn() }));
jest.mock("@/components/MarkdownContent", () => ({ MarkdownContent: ({ children }: { children: string }) => <div data-testid="markdown">{children}</div> }));

const mockAuth = auth as unknown as jest.Mock;
const mockGet = jest.mocked(getBlogPost);
const mockList = jest.mocked(listBlogPosts);

const post = {
  slug: "middle",
  title: "Middle Post",
  date: "2026-05-01",
  summary: "The middle one.",
  content: "Intro text.\n\n## First\n\ntext\n\n## Second\n\ntext\n\n### Second A\n\ntext",
  tags: ["ai"],
  status: "published" as const,
};
const summary = (slug: string, title: string) => ({ slug, title, date: "2026-01-01", summary: "s", tags: [], status: "published" as const, readingMinutes: 1 });

const load = async (slug = "middle") => render(await BlogPostPage({ params: Promise.resolve({ slug }) }));

beforeEach(() => {
  mockAuth.mockResolvedValue(null);
  mockList.mockResolvedValue([summary("newest", "Newest Post"), summary("middle", "Middle Post"), summary("oldest", "Oldest Post")]);
  mockGet.mockImplementation(async (slug, options) => {
    if (slug === "middle") return post;
    if (slug === "draft") return options?.includeDrafts ? { ...post, slug: "draft", status: "draft" as const } : undefined;
    return undefined;
  });
});

describe("blog post page", () => {
  it("shows the post with date, reading time, tags, table of contents, share links and neighbours", async () => {
    await load();

    expect(screen.getByRole("heading", { level: 1, name: "Middle Post" })).toBeInTheDocument();
    expect(screen.getByText(/May 1, 2026/)).toBeInTheDocument();
    expect(screen.getByText(/1 min read/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "ai" })).toHaveAttribute("href", "/blog?tag=ai");
    expect(within(screen.getByRole("navigation", { name: "Table of contents" })).getAllByRole("link")).toHaveLength(3);
    expect(screen.getAllByRole("group", { name: "Share this post" })).toHaveLength(2);
    expect(screen.getByTestId("markdown")).toHaveTextContent("Intro text.");
    expect(screen.getByRole("link", { name: /Previous.*Oldest Post/ })).toHaveAttribute("href", "/blog/oldest");
    expect(screen.getByRole("link", { name: /Next.*Newest Post/ })).toHaveAttribute("href", "/blog/newest");
    expect(screen.queryByText(/Draft preview/)).not.toBeInTheDocument();
  });

  it("embeds structured data with keywords and reading time", async () => {
    const { container } = await load();

    const data = JSON.parse(container.querySelector('script[type="application/ld+json"]')!.innerHTML);
    expect(data).toMatchObject({ "@type": "BlogPosting", headline: "Middle Post", keywords: "ai", timeRequired: "PT1M", datePublished: "2026-05-01" });
  });

  it("returns not found for unknown posts", async () => {
    await expect(BlogPostPage({ params: Promise.resolve({ slug: "missing" }) })).rejects.toMatchObject({ digest: expect.stringContaining("404") });
  });

  it("hides drafts from visitors but previews them for the Admin, with a banner and noindex", async () => {
    await expect(BlogPostPage({ params: Promise.resolve({ slug: "draft" }) })).rejects.toMatchObject({ digest: expect.stringContaining("404") });
    expect(mockGet).toHaveBeenLastCalledWith("draft", { includeDrafts: false });

    mockAuth.mockResolvedValue({ role: "Admin" });
    await load("draft");
    expect(mockGet).toHaveBeenLastCalledWith("draft", { includeDrafts: true });
    expect(screen.getByText(/Draft preview/)).toBeInTheDocument();

    const metadata = await generateMetadata({ params: Promise.resolve({ slug: "draft" }) });
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });

  it("builds metadata for a published post without noindex", async () => {
    const metadata = await generateMetadata({ params: Promise.resolve({ slug: "middle" }) });

    expect(metadata).toMatchObject({ title: "Middle Post", description: "The middle one.", alternates: { canonical: "/blog/middle" } });
    expect(metadata.robots).toBeUndefined();
    expect(await generateMetadata({ params: Promise.resolve({ slug: "missing" }) })).toEqual({});
  });
});
