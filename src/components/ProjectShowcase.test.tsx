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

    // The custom progress line replaces the native scrollbar and reflects how much of the row is visible.
    const thumb = screen.getByTestId("scroll-progress-thumb");
    expect(thumb.style.left).toBe("0%");
    expect(parseFloat(thumb.style.width)).toBeCloseTo(33.3, 0);

    await user.click(next);
    expect(scrollBy).toHaveBeenCalledWith(expect.objectContaining({ left: expect.any(Number) }));
    expect(scrollBy.mock.calls[0][0].left).toBeGreaterThan(0);
  });

  describe("draggable scroll line", () => {
  // jsdom's PointerEvent drops coordinates, so send mouse events named as pointer events.
  const pointer = (target: Element, type: "pointerdown" | "pointermove" | "pointerup", clientX: number, button = 0) =>
    fireEvent(target, new MouseEvent(type, { bubbles: true, cancelable: true, clientX, button }));

    // jsdom has no layout: describe a 1200px row in a 400px viewport, with a 600px track and a 200px handle.
    function setupTrack() {
      render(<ProjectShowcase projects={projects} />);
      const region = screen.getByRole("region", { name: /scrolls horizontally/i });
      region.scrollTo = jest.fn();
      region.scrollBy = jest.fn();
      Object.defineProperty(region, "scrollWidth", { configurable: true, value: 1200 });
      Object.defineProperty(region, "clientWidth", { configurable: true, value: 400 });
      fireEvent.scroll(region);
      const track = screen.getByRole("scrollbar", { name: "Scroll projects" });
      const thumb = screen.getByTestId("scroll-progress-thumb");
      track.getBoundingClientRect = () => ({ left: 0, right: 600, width: 600, top: 0, bottom: 24, height: 24, x: 0, y: 0, toJSON: () => ({}) });
      thumb.getBoundingClientRect = () => ({ left: 0, right: 200, width: 200, top: 0, bottom: 2, height: 2, x: 0, y: 0, toJSON: () => ({}) });
      return { region, track };
    }

    it("is exposed as a horizontal scrollbar for the row and reports position", async () => {
      const { region, track } = setupTrack();

      await waitFor(() => expect(track).toBeInTheDocument());
      expect(track).toHaveAttribute("aria-orientation", "horizontal");
      expect(track).toHaveAttribute("aria-controls", region.id);
      expect(track).toHaveAttribute("aria-valuenow", "0");
    });

    it("jumps the row when the line is clicked away from the handle", () => {
      const { region, track } = setupTrack();

      pointer(track, "pointerdown", 500, 0);
      pointer(track, "pointerup", 500);

      // Handle centres on the click: (500 - 100) / (600 - 200) = 100% of the 800px of overflow.
      expect(region.scrollTo).toHaveBeenLastCalledWith({ left: 800, behavior: "auto" });
    });

    it("scrubs the row while the handle is dragged, and turns snapping off until release", () => {
      const { region, track } = setupTrack();

      pointer(track, "pointerdown", 100, 0);
      expect(region.className).toContain("snap-none");

      pointer(track, "pointermove", 300);
      // Grabbed 100px into the handle: (300 - 100) / 400 = 50% of the overflow.
      expect(region.scrollTo).toHaveBeenLastCalledWith({ left: 400, behavior: "auto" });

      pointer(track, "pointerup", 300);
      expect(region.className).toContain("snap-mandatory");

      (region.scrollTo as jest.Mock).mockClear();
      pointer(track, "pointermove", 500);
      expect(region.scrollTo).not.toHaveBeenCalled();
    });

    it("ignores non-primary mouse buttons", () => {
      const { region, track } = setupTrack();

      pointer(track, "pointerdown", 500, 2);

      expect(region.scrollTo).not.toHaveBeenCalled();
      expect(region.className).not.toContain("snap-none");
    });

    it("scrolls with the arrow, Home and End keys", async () => {
      const user = userEvent.setup();
      const { region, track } = setupTrack();

      track.focus();
      await user.keyboard("{ArrowRight}");
      expect((region.scrollBy as jest.Mock).mock.calls[0][0].left).toBeGreaterThan(0);
      await user.keyboard("{ArrowLeft}");
      expect((region.scrollBy as jest.Mock).mock.calls[1][0].left).toBeLessThan(0);
      await user.keyboard("{End}");
      expect(region.scrollTo).toHaveBeenLastCalledWith(expect.objectContaining({ left: 1200 }));
      await user.keyboard("{Home}");
      expect(region.scrollTo).toHaveBeenLastCalledWith(expect.objectContaining({ left: 0 }));
    });
  });

  it("fades only the edges that still hide cards", async () => {
    render(<ProjectShowcase projects={projects} />);
    const region = screen.getByRole("region", { name: /scrolls horizontally/i });
    Object.defineProperty(region, "scrollWidth", { configurable: true, value: 1200 });
    Object.defineProperty(region, "clientWidth", { configurable: true, value: 400 });

    // At the start only the right edge fades.
    fireEvent.scroll(region);
    await waitFor(() => expect(region.className).toContain("mask-image:linear-gradient(to_right,black_90%,transparent)"));

    // In the middle both edges fade.
    Object.defineProperty(region, "scrollLeft", { configurable: true, value: 400 });
    fireEvent.scroll(region);
    await waitFor(() => expect(region.className).toContain("transparent,black_8%,black_92%,transparent"));

    // At the end only the left edge fades.
    Object.defineProperty(region, "scrollLeft", { configurable: true, value: 800 });
    fireEvent.scroll(region);
    await waitFor(() => expect(region.className).toContain("linear-gradient(to_right,transparent,black_8%)"));
  });

  it("hides the native scrollbar", () => {
    render(<ProjectShowcase projects={projects} />);

    const region = screen.getByRole("region", { name: /scrolls horizontally/i });
    expect(region.className).toContain("[scrollbar-width:none]");
    expect(region.className).toContain("[&::-webkit-scrollbar]:hidden");
  });

  it("has a work anchor for the navigation and a placeholder when empty", () => {
    const { container, rerender } = render(<ProjectShowcase projects={projects} />);
    expect(container.querySelector("#work")).toBeInTheDocument();

    rerender(<ProjectShowcase projects={[]} />);
    expect(screen.getByText("Projects coming soon.")).toBeInTheDocument();
  });
});
