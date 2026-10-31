import { render, screen } from "@testing-library/react";

import { WritingPreview } from "@/components/WritingPreview";

describe("WritingPreview", () => {
  it("renders post previews and a route to the full writing archive", () => {
    render(
      <WritingPreview
        posts={[{ slug: "systems-that-breathe", title: "Systems That Breathe", date: "2026-09-01", summary: "Notes on calm systems." }]}
      />,
    );

    expect(screen.getByRole("heading", { name: /writing and research/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /systems that breathe/i })).toHaveAttribute("href", "/blog/systems-that-breathe");
    expect(screen.getByRole("link", { name: /read all writing/i })).toHaveAttribute("href", "/blog");
  });
});

describe("WritingPreview featured layout", () => {
  const posts = [
    { slug: "latest-post", title: "Latest Post", date: "2026-09-01", summary: "The newest." },
    { slug: "older-post", title: "Older Post", date: "2026-08-01", summary: "An older one." },
    { slug: "third-post", title: "Third Post", date: "2026-07-01", summary: "Not shown." },
  ];

  it("marks the newest post as the latest and shows only two posts", () => {
    render(<WritingPreview posts={posts} />);

    expect(screen.getByText("Latest")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Latest Post" })).toHaveAttribute("href", "/blog/latest-post");
    expect(screen.getByRole("link", { name: "Older Post" })).toHaveAttribute("href", "/blog/older-post");
    expect(screen.queryByText("Third Post")).not.toBeInTheDocument();
  });

  it("gives each post exactly one link, so the whole card can be clicked without doubling up for assistive tech", () => {
    render(<WritingPreview posts={posts.slice(0, 2)} />);

    expect(screen.getAllByRole("link").filter((link) => link.getAttribute("href")?.startsWith("/blog/"))).toHaveLength(2);
  });

  it("says new writing is on the way when there are no posts", () => {
    render(<WritingPreview posts={[]} />);

    expect(screen.getByText("New writing is on the way.")).toBeInTheDocument();
  });
});
