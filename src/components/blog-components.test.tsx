import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { HeadingWithId, childrenText } from "@/components/markdown-heading";
import { PostNav } from "@/components/PostNav";
import { ShareLinks } from "@/components/ShareLinks";
import { TableOfContents } from "@/components/TableOfContents";
import { slugifyHeading } from "@/lib/content/blog-utils";

describe("HeadingWithId", () => {
  it("gives headings the same anchor id the table of contents links to", () => {
    render(<HeadingWithId level={2}>A useful constraint</HeadingWithId>);

    const heading = screen.getByRole("heading", { level: 2, name: "A useful constraint" });
    expect(heading).toHaveAttribute("id", slugifyHeading("A useful constraint"));
  });

  it("reads text through nested formatting and renders h3 for level three", () => {
    const { container } = render(<HeadingWithId level={3}>Using <code>fetch</code> and <strong>care</strong></HeadingWithId>);

    expect(container.querySelector("h3")).toHaveAttribute("id", "using-fetch-and-care");
    expect(childrenText(["a", 1, <em key="x">b</em>, null])).toBe("a1b");
  });
});

describe("TableOfContents", () => {
  const headings = [
    { id: "one", text: "One", level: 2 as const },
    { id: "one-a", text: "One A", level: 3 as const },
    { id: "two", text: "Two", level: 2 as const },
  ];

  it("links each heading, indenting sub-headings", () => {
    render(<TableOfContents headings={headings} />);

    const nav = screen.getByRole("navigation", { name: "Table of contents" });
    expect(within(nav).getByRole("link", { name: "Two" })).toHaveAttribute("href", "#two");
    expect(within(nav).getByRole("link", { name: "One A" }).closest("li")).toHaveClass("pl-4");
  });

  it("stays out of the way for short posts", () => {
    const { container } = render(<TableOfContents headings={headings.slice(0, 2)} />);

    expect(container).toBeEmptyDOMElement();
  });
});

describe("PostNav", () => {
  it("links to newer and older posts, and renders nothing when neither exists", () => {
    const { container, rerender } = render(<PostNav newer={{ slug: "n", title: "Newer" }} older={{ slug: "o", title: "Older" }} />);

    expect(screen.getByRole("link", { name: /Previous.*Older/ })).toHaveAttribute("href", "/blog/o");
    expect(screen.getByRole("link", { name: /Next.*Newer/ })).toHaveAttribute("href", "/blog/n");

    rerender(<PostNav />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe("ShareLinks", () => {
  it("builds share links with the encoded address and title", () => {
    render(<ShareLinks url="https://karan.dev/blog/a b" title="Hello & welcome" />);

    const group = screen.getByRole("group", { name: "Share this post" });
    expect(within(group).getByRole("link", { name: "LinkedIn" })).toHaveAttribute("href", "https://www.linkedin.com/sharing/share-offsite/?url=https%3A%2F%2Fkaran.dev%2Fblog%2Fa%20b");
    const x = within(group).getByRole("link", { name: "X" });
    expect(x.getAttribute("href")).toContain("text=Hello%20%26%20welcome");
    expect(x).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("copies the link and confirms it", async () => {
    const user = userEvent.setup();
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    render(<ShareLinks url="https://karan.dev/blog/a" title="A" />);

    await user.click(screen.getByRole("button", { name: "Copy link" }));

    expect(writeText).toHaveBeenCalledWith("https://karan.dev/blog/a");
    expect(await screen.findByRole("button", { name: "Link copied" })).toBeInTheDocument();
  });

  it("does not claim success when copying is blocked", async () => {
    const user = userEvent.setup();
    Object.defineProperty(navigator, "clipboard", { value: { writeText: jest.fn().mockRejectedValue(new Error("denied")) }, configurable: true });
    render(<ShareLinks url="https://karan.dev/blog/a" title="A" />);

    await user.click(screen.getByRole("button", { name: "Copy link" }));

    expect(screen.getByRole("button", { name: "Copy link" })).toBeInTheDocument();
  });
});
