import { fireEvent, render, screen } from "@testing-library/react";

import { SiteHeader } from "@/components/SiteHeader";

jest.mock("@/components/AuthControls", () => ({ AuthControls: () => <button type="button">Sign in</button> }));

const links = [{ label: "Work", href: "#work" }, { label: "About", href: "#about" }, { label: "Resume", href: "/resume" }];

function renderHeader() {
  return render(<SiteHeader name="Karan Kaushik Khatri" links={links} session={null} />);
}

describe("SiteHeader", () => {
  it("has one navigation with every link, plus the account control", () => {
    renderHeader();

    const nav = screen.getByRole("navigation", { name: "Primary navigation" });
    expect(nav.querySelectorAll("a")).toHaveLength(links.length);
    expect(screen.getByRole("link", { name: "Work" })).toHaveAttribute("href", "#work");
    expect(screen.getByRole("link", { name: "Resume" })).toHaveAttribute("href", "/resume");
    expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Karan Kaushik Khatri/ })).toHaveAttribute("href", "/");
  });

  it("keeps the menu closed until the menu button is used, and tells assistive tech its state", () => {
    renderHeader();
    const button = screen.getByRole("button", { name: "Open menu" });

    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByRole("navigation", { name: "Primary navigation" })).toHaveClass("hidden");

    fireEvent.click(button);
    expect(screen.getByRole("button", { name: "Close menu" })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("navigation", { name: "Primary navigation" })).toHaveClass("flex");
    expect(button).toHaveAttribute("aria-controls", screen.getByRole("navigation", { name: "Primary navigation" }).id);
  });

  it("closes the menu with Escape, with a click outside, and after choosing a link", () => {
    renderHeader();
    const nav = () => screen.getByRole("navigation", { name: "Primary navigation" });

    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(nav()).toHaveClass("hidden");

    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    fireEvent.pointerDown(document.body);
    expect(nav()).toHaveClass("hidden");

    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    fireEvent.click(screen.getByRole("link", { name: "About" }));
    expect(nav()).toHaveClass("hidden");
  });

  it("is transparent at the top of the page and frosted once the page is scrolled", () => {
    const { container } = renderHeader();
    const header = container.querySelector("header");
    expect(header).toHaveClass("bg-transparent");

    Object.defineProperty(window, "scrollY", { value: 120, configurable: true });
    fireEvent.scroll(window);
    expect(header).toHaveClass("backdrop-blur-md");
    expect(header).not.toHaveClass("bg-transparent");

    Object.defineProperty(window, "scrollY", { value: 0, configurable: true });
    fireEvent.scroll(window);
    expect(header).toHaveClass("bg-transparent");
  });

  it("stays frosted while the menu is open, so its links are readable over the hero", () => {
    const { container } = renderHeader();

    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    expect(container.querySelector("header")).toHaveClass("backdrop-blur-md");
  });

  it("never wraps: the bar has a fixed height at every size", () => {
    const { container } = renderHeader();

    const bar = container.querySelector("header > div");
    expect(bar).toHaveClass("h-16", "lg:h-20");
    expect(bar?.className).not.toMatch(/flex-wrap/);
  });
});
