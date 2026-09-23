/**
 * @jest-environment node
 */
import { neon } from "@neondatabase/serverless";

import { createPost, deletePost, getBlogPost, listBlogPosts, listPostsForAdmin, postExists, updatePost } from "@/lib/content/blog";

jest.mock("@neondatabase/serverless", () => ({ neon: jest.fn() }));

const sqlMock = jest.fn();
const mockNeon = jest.mocked(neon);
const env = process.env as Record<string, string | undefined>;
const original = env.DATABASE_URL;

const row = (overrides: Record<string, unknown> = {}) => ({ slug: "hello", title: "Hello", date: "2026-09-01", summary: "Hi", content: "Body text here.", tags: ["ai"], status: "published", ...overrides });

beforeEach(() => {
  sqlMock.mockReset();
  mockNeon.mockReturnValue(sqlMock as unknown as ReturnType<typeof neon>);
  env.DATABASE_URL = "postgres://test";
});

afterAll(() => {
  env.DATABASE_URL = original;
});

describe("listBlogPosts", () => {
  it("returns published posts as summaries with reading time and no body", async () => {
    sqlMock.mockResolvedValue([row(), row({ slug: "long", content: Array(500).fill("word").join(" "), tags: null })]);

    const posts = await listBlogPosts();

    expect(posts.map((post) => [post.slug, post.readingMinutes, post.tags])).toEqual([["hello", 1, ["ai"]], ["long", 3, []]]);
    expect(posts[0]).not.toHaveProperty("content");
    expect(String(sqlMock.mock.calls[0][0].join(""))).toContain("status = 'published'");
  });
});

describe("getBlogPost", () => {
  it("returns a published post and refuses drafts unless asked", async () => {
    sqlMock.mockResolvedValue([row({ status: "draft" })]);

    expect(await getBlogPost("hello")).toBeUndefined();
    expect(await getBlogPost("hello", { includeDrafts: true })).toMatchObject({ slug: "hello", status: "draft", content: "Body text here." });

    sqlMock.mockResolvedValue([row()]);
    expect(await getBlogPost("hello")).toMatchObject({ title: "Hello" });
  });

  it("returns undefined for unknown or unsafe slugs without touching the database", async () => {
    sqlMock.mockResolvedValue([]);
    expect(await getBlogPost("missing")).toBeUndefined();

    sqlMock.mockClear();
    expect(await getBlogPost("../etc/passwd")).toBeUndefined();
    expect(sqlMock).not.toHaveBeenCalled();
  });
});

describe("admin operations", () => {
  const input = { slug: "hello", title: "Hello", date: "2026-09-01", summary: "Hi", content: "Body", tags: ["ai"], status: "draft" as const };

  it("lists every post including drafts", async () => {
    sqlMock.mockResolvedValue([row(), row({ slug: "d", status: "draft" })]);

    expect((await listPostsForAdmin()).map((post) => post.status)).toEqual(["published", "draft"]);
  });

  it("creates, updates and deletes", async () => {
    sqlMock.mockResolvedValueOnce([row({ status: "draft" })]);
    expect(await createPost(input)).toMatchObject({ slug: "hello", status: "draft" });
    expect(sqlMock.mock.calls[0]).toContain(JSON.stringify(["ai"]));

    sqlMock.mockResolvedValueOnce([row({ title: "Renamed" })]);
    expect(await updatePost("hello", { ...input, title: "Renamed" })).toMatchObject({ title: "Renamed" });

    sqlMock.mockResolvedValueOnce([]);
    expect(await updatePost("nope", input)).toBeUndefined();

    sqlMock.mockResolvedValueOnce([{ slug: "hello" }]);
    expect(await deletePost("hello")).toBe(true);
    sqlMock.mockResolvedValueOnce([]);
    expect(await deletePost("hello")).toBe(false);
  });

  it("checks whether a slug is taken", async () => {
    sqlMock.mockResolvedValueOnce([{ found: 1 }]);
    expect(await postExists("hello")).toBe(true);
    sqlMock.mockResolvedValueOnce([]);
    expect(await postExists("free")).toBe(false);
  });
});

it("fails clearly when the database is not configured", async () => {
  delete env.DATABASE_URL;

  await expect(listBlogPosts()).rejects.toThrow("DATABASE_URL is not configured");
});
