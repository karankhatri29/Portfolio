import { render, screen, within } from "@testing-library/react";

import { OpenSource } from "@/components/OpenSource";
import { Publications } from "@/components/Publications";
import { Testimonials } from "@/components/Testimonials";
import type { Highlight } from "@/lib/content/repository";

const quote: Highlight = { id: "1", kind: "testimonial", title: "Ada Lovelace", subtitle: "Engineering manager, Analytical Co", body: "Karan shipped it early.", url: "https://linkedin.com/in/ada" };
const paper: Highlight = { id: "2", kind: "publication", title: "Multimodal Fake News Detection", subtitle: "Conference, 2026", body: "Domain-aware feature selection.", url: "https://doi.org/10.1/x" };

describe("Testimonials", () => {
  it("renders nothing when there are none", () => {
    const { container } = render(<Testimonials items={[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("shows the quote, the person as a link, and their role", () => {
    render(<Testimonials items={[quote, { ...quote, id: "3", title: "Grace", url: undefined, subtitle: "" }]} />);

    expect(screen.getByRole("heading", { name: "Kind words" })).toBeInTheDocument();
    expect(screen.getAllByText(/Karan shipped it early/)).toHaveLength(2);
    const link = screen.getByRole("link", { name: "Ada Lovelace" });
    expect(link).toHaveAttribute("href", "https://linkedin.com/in/ada");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(screen.getByText("Engineering manager, Analytical Co")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Grace" })).not.toBeInTheDocument();
    expect(screen.getByText("Grace")).toBeInTheDocument();
  });
});

describe("Publications", () => {
  it("renders nothing when there are none", () => {
    const { container } = render(<Publications items={[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("lists each paper with venue, summary and a link", () => {
    render(<Publications items={[paper, { ...paper, id: "4", title: "Unlinked Paper", url: undefined, body: "" }]} />);

    expect(screen.getByRole("heading", { name: "Research and publications" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Multimodal Fake News Detection" })).toHaveAttribute("href", "https://doi.org/10.1/x");
    expect(screen.getAllByText("Conference, 2026")).toHaveLength(2);
    expect(screen.getByText("Domain-aware feature selection.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Unlinked Paper" })).toBeInTheDocument();
  });
});

describe("OpenSource", () => {
  const activity = {
    username: "karan",
    publicRepos: 21,
    totalStars: 1234,
    activeRepoCount: 4,
    commitsLast30Days: 87,
    pinnedRepos: [],
    recentRepos: [
      { name: "graph-tools", url: "https://github.com/karan/graph-tools", description: "Graph helpers", language: "Python", stars: 1, pushedAt: "2026-10-20T10:00:00Z", owner: "karan" },
      { name: "notes", url: "https://github.com/karan/notes", description: "", language: "", stars: 0, pushedAt: "", owner: "karan" },
    ],
  };

  it("renders nothing when GitHub could not be reached", () => {
    const { container } = render(<OpenSource activity={null} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("shows pinned organisation repositories with their owner, and no Pinned group when there are none", () => {
    const org = { name: "platform", url: "https://github.com/acme/platform", description: "Org repo", language: "Go", stars: 9, pushedAt: "2026-10-20T00:00:00Z", owner: "acme" };
    const { rerender } = render(<OpenSource activity={{ ...activity, pinnedRepos: [org] }} />);

    expect(within(screen.getByRole("list", { name: "Pinned" })).getByRole("link", { name: "acme/platform" })).toHaveAttribute("href", "https://github.com/acme/platform");

    rerender(<OpenSource activity={{ ...activity, pinnedRepos: [] }} />);
    expect(screen.queryByRole("list", { name: "Pinned" })).not.toBeInTheDocument();
  });

  it("hides the commit count when it is unavailable", () => {
    render(<OpenSource activity={{ ...activity, commitsLast30Days: null }} />);

    expect(screen.queryByText("Commits in last 30 days")).not.toBeInTheDocument();
    expect(screen.getByText("Active in last 30 days")).toBeInTheDocument();
  });

  it("shows headline numbers, the profile link and recently updated repositories", () => {
    render(<OpenSource activity={activity} />);

    expect(screen.getByRole("link", { name: "@karan" })).toHaveAttribute("href", "https://github.com/karan");
    expect(screen.getAllByText("1,234")).toHaveLength(2); // the visible number plus the screen-reader copy
    expect(screen.getByText("Public repositories")).toBeInTheDocument();
    expect(screen.getAllByText("87")).toHaveLength(2);
    expect(screen.getByText("Commits in last 30 days")).toBeInTheDocument();
    const repos = screen.getByRole("list", { name: "Currently working on" });
    expect(within(repos).getByRole("link", { name: "graph-tools" })).toHaveAttribute("target", "_blank");
    expect(within(repos).getByText("Python · 1 star · updated Oct 20, 2026")).toBeInTheDocument();
    expect(within(repos).getByText("0 stars")).toBeInTheDocument();
  });
});
