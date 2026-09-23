import { render, screen } from "@testing-library/react";

import BlogIndexPage from "@/app/blog/page";

describe("blog index", () => {
  it("renders parsed post metadata as links", async () => {
    render(await BlogIndexPage());

    expect(screen.getByRole("heading", { name: /writing and research/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /systems that breathe/i })).toHaveAttribute("href", "/blog/systems-that-breathe");
  });
});
