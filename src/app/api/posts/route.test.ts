/**
 * @jest-environment node
 */
import { auth } from "@/auth";
import * as blog from "@/lib/content/blog";

import { DELETE, GET, PATCH, POST } from "./route";

jest.mock("@/auth", () => ({ auth: jest.fn() }));
jest.mock("@/lib/content/blog", () => ({ listPostsForAdmin: jest.fn(), postExists: jest.fn(), createPost: jest.fn(), updatePost: jest.fn(), deletePost: jest.fn() }));

const mockAuth = auth as unknown as jest.Mock;
const repo = jest.mocked(blog);

const post = { slug: "hello", title: "Hello", date: "2026-09-01", summary: "Hi there.", content: "Body.", tags: ["ai"], status: "draft" };
const request = (method: string, body?: unknown) => new Request("http://localhost/api/posts", { method, body: body === undefined ? undefined : JSON.stringify(body) });

describe("/api/posts authorization", () => {
  it("rejects signed-out and Visitor sessions on every method", async () => {
    const calls = () => Promise.all([GET(), POST(request("POST", post)), PATCH(request("PATCH", post)), DELETE(request("DELETE", { slug: "hello" }))]);

    mockAuth.mockResolvedValue(null);
    expect((await calls()).map((response) => response.status)).toEqual([401, 401, 401, 401]);

    mockAuth.mockResolvedValue({ role: "Visitor" });
    expect((await calls()).map((response) => response.status)).toEqual([403, 403, 403, 403]);
    expect(repo.createPost).not.toHaveBeenCalled();
    expect(repo.updatePost).not.toHaveBeenCalled();
    expect(repo.deletePost).not.toHaveBeenCalled();
  });
});

describe("/api/posts as Admin", () => {
  beforeEach(() => mockAuth.mockResolvedValue({ role: "Admin" }));

  it("lists every post, drafts included", async () => {
    repo.listPostsForAdmin.mockResolvedValue([post as never]);

    expect(await (await GET()).json()).toEqual({ posts: [post] });
  });

  it("creates a post, refuses a taken slug, and validates input", async () => {
    repo.postExists.mockResolvedValue(false);
    repo.createPost.mockResolvedValue(post as never);
    expect((await POST(request("POST", post))).status).toBe(201);
    expect(repo.createPost).toHaveBeenCalledWith(post);

    repo.postExists.mockResolvedValue(true);
    expect((await POST(request("POST", post))).status).toBe(409);

    repo.createPost.mockClear();
    const invalid = await POST(request("POST", { ...post, title: "", date: "soon" }));
    expect(invalid.status).toBe(400);
    expect((await invalid.json()).errors).toEqual(expect.arrayContaining(["title is required", "date must be a real date written as YYYY-MM-DD"]));
    expect(repo.createPost).not.toHaveBeenCalled();
  });

  it("updates by slug without letting the slug change, and reports unknown posts", async () => {
    repo.updatePost.mockResolvedValue(post as never);
    expect((await PATCH(request("PATCH", { ...post, status: "published" }))).status).toBe(200);
    expect(repo.updatePost).toHaveBeenCalledWith("hello", expect.objectContaining({ status: "published", title: "Hello" }));
    expect(repo.updatePost.mock.calls[0][1]).not.toHaveProperty("slug");

    repo.updatePost.mockResolvedValue(undefined);
    expect((await PATCH(request("PATCH", post))).status).toBe(404);
  });

  it("deletes by slug and handles missing input or posts", async () => {
    repo.deletePost.mockResolvedValue(true);
    expect((await DELETE(request("DELETE", { slug: "hello" }))).status).toBe(200);
    expect((await DELETE(request("DELETE", {}))).status).toBe(400);

    repo.deletePost.mockResolvedValue(false);
    expect((await DELETE(request("DELETE", { slug: "nope" }))).status).toBe(404);
  });

  it("hides internal errors", async () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
    repo.listPostsForAdmin.mockRejectedValue(new Error("postgres://secret"));

    const response = await GET();

    expect(response.status).toBe(500);
    expect(await response.text()).not.toContain("secret");
    consoleError.mockRestore();
  });
});
