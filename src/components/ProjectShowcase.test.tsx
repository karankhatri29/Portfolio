import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ProjectShowcase } from "@/components/ProjectShowcase";
import type { Project } from "@/lib/content/repository";

const projects: Project[] = ["Alpha", "Beta", "Gamma"].map((title) => ({
  slug: title.toLowerCase(),
  title,
  year: "2026",
  summary: `${title} summary.`,
  role: "Engineer",
  outcomes: ["Did it"],
  githubUrl: title === "Alpha" ? `https://github.com/example/${title.toLowerCase()}` : undefined,
}));

describe("ProjectShowcase", () => {
  it("renders every project as a card in a horizontally scrolling, keyboard-focusable region", () => {
    render(<ProjectShowcase projects={projects} fallbackGithubUrl="https://github.com/example" />);

    const region = screen.getByRole("region", { name: /scrolls horizontally/i });
    expect(region).toHaveAttribute("tabindex", "0");
    for (const project of projects) expect(within(region).getByRole("heading", { name: project.title })).toBeInTheDocument();
  });

  it("puts a GitHub link on every project, using the profile when a repository isn't set", () => {
    render(<ProjectShowcase projects={projects} fallbackGithubUrl="https://github.com/example" />);

    expect(screen.getByRole("link", { name: "Alpha on GitHub" })).toHaveAttribute("href", "https://github.com/example/alpha");
    expect(screen.getAllByRole("link", { name: "GitHub profile" })).toHaveLength(2);
  });

  it("scrolls the row when the arrow buttons are used", async () => {
    const user = userEvent.setup();
    render(<ProjectShowcase projects={projects} />);

    const region = screen.getByRole("region", { name: /scrolls horizontally/i });
    const scrollBy = jest.fn();
    region.scrollBy = scrollBy;
    // jsdom has no layout, so describe a row that is wider than its viewport and starts at the left edge.
    Object.defineProperty(region, "scrollWidth", { configurable: true, value: 1200 });
    Object.defineProperty(region, "clientWidth", { configurable: true, value: 400 });
    fireEvent.scroll(region);

    const next = screen.getByRole("button", { name: "Next projects" });
    await waitFor(() => expect(next).toBeEnabled());
    expect(screen.getByRole("button", { name: "Previous projects" })).toBeDisabled();
    await user.click(next);
    expect(scrollBy).toHaveBeenCalledWith(expect.objectContaining({ left: expect.any(Number) }));
    expect(scrollBy.mock.calls[0][0].left).toBeGreaterThan(0);
  });

  it("has a work anchor for the navigation and a placeholder when empty", () => {
    const { container, rerender } = render(<ProjectShowcase projects={projects} />);
    expect(container.querySelector("#work")).toBeInTheDocument();

    rerender(<ProjectShowcase projects={[]} />);
    expect(screen.getByText("Projects coming soon.")).toBeInTheDocument();
  });
});
