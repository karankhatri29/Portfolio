import { render, screen } from "@testing-library/react";

import { RelatedPosts, relatedPosts } from "@/components/RelatedPosts";
import { snippet } from "@/lib/seo";

const post = (slug: string, tags: string[]) => ({ slug, title: `Post ${slug}`, summary: `About ${slug}`, tags });

describe("relatedPosts", () => {
  it("ranks by shared tags, skips the current post and posts with nothing in common", () => {
    const all = [post("a", ["ai", "nlp"]), post("b", ["ai"]), post("c", ["ai", "nlp", "graphs"]), post("d", ["web"])];

    expect(relatedPosts(post("a", ["ai", "nlp"]), all).map((item) => item.slug)).toEqual(["c", "b"]);
  });

  it("renders links and nothing when there are no related posts", () => {
    const { rerender } = render(<RelatedPosts posts={[post("b", ["ai"])]} />);
    expect(screen.getByRole("link", { name: /Post b/ })).toHaveAttribute("href", "/blog/b");

    rerender(<RelatedPosts posts={[]} />);
    expect(screen.queryByRole("heading", { name: "Related reading" })).toBeNull();
  });
});

describe("snippet", () => {
  it("keeps short text and trims long text on a word boundary with an ellipsis", () => {
    expect(snippet("  short   text ")).toBe("short text");

    const long = snippet("word ".repeat(80));
    expect(long.length).toBeLessThanOrEqual(160);
    expect(long.endsWith("word…")).toBe(true);
  });
});
