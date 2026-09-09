import { getBlogPost, listBlogPosts } from "@/lib/content/blog";

describe("blog content loader", () => {
  it("parses front matter and Markdown body by slug", () => {
    const post = getBlogPost("systems-that-breathe");

    expect(post?.title).toBe("Systems That Breathe");
    expect(post?.summary).toContain("complex software");
    expect(post?.content).toContain("Good systems leave room");
  });

  it("lists parsed posts without exposing filesystem paths", () => {
    const posts = listBlogPosts();

    expect(posts).toEqual(expect.arrayContaining([expect.objectContaining({ slug: "systems-that-breathe" })]));
    expect(JSON.stringify(posts)).not.toContain("src\\content");
  });

  it("returns undefined for an unknown slug", () => {
    expect(getBlogPost("missing-post")).toBeUndefined();
  });
});
