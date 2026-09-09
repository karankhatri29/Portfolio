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
