import { render, screen } from "@testing-library/react";

import { ContactFooter } from "@/components/ContactFooter";
import { portfolioContent } from "@/data/portfolio";

describe("ContactFooter", () => {
  it("renders named contact links with embedded brand icons", () => {
    render(<ContactFooter links={portfolioContent.contactLinks} name={portfolioContent.name} />);

    for (const link of portfolioContent.contactLinks) {
      const contactLink = screen.getByRole("link", { name: link.label });
      expect(contactLink).toHaveAttribute("href", link.href);
      expect(contactLink.querySelector("svg path")?.getAttribute("d")).toBeTruthy();
    }
  });

  it("shows readable handles instead of raw URLs", () => {
    render(<ContactFooter links={portfolioContent.contactLinks} />);

    expect(screen.getByText("karankhatri2924@gmail.com")).toBeInTheDocument();
    expect(screen.getByText("github.com/karankhatri29")).toBeInTheDocument();
    expect(screen.getByText("linkedin.com/in/karan-khatri-46729a277")).toBeInTheDocument();
  });

  it("opens external profiles safely in a new tab", () => {
    render(<ContactFooter links={portfolioContent.contactLinks} />);

    const github = screen.getByRole("link", { name: "Karan on GitHub" });
    expect(github).toHaveAttribute("target", "_blank");
    expect(github).toHaveAttribute("rel", "noopener noreferrer");
    expect(screen.getByRole("link", { name: "Email Karan" })).not.toHaveAttribute("target");
  });

  it("offers a primary email call to action and a contact anchor", () => {
    const { container } = render(<ContactFooter links={portfolioContent.contactLinks} />);

    expect(screen.getByRole("link", { name: /say hello/i })).toHaveAttribute("href", "mailto:karankhatri2924@gmail.com");
    expect(container.querySelector("#contact")).toBeInTheDocument();
  });
});

describe("ContactFooter privacy", () => {
  it("does not publish a phone number", () => {
    const { container } = render(<ContactFooter links={portfolioContent.contactLinks} />);

    expect(container.querySelector('a[href^="tel:"]')).toBeNull();
    expect(container.textContent).not.toMatch(/\+?\d[\d\s-]{8,}\d/);
    expect(JSON.stringify(portfolioContent)).not.toMatch(/tel:|\+91/);
  });

  it("links to the privacy page and the RSS feed", () => {
    render(<ContactFooter links={portfolioContent.contactLinks} />);

    expect(screen.getByRole("link", { name: "Privacy" })).toHaveAttribute("href", "/privacy");
    expect(screen.getByRole("link", { name: "RSS" })).toHaveAttribute("href", "/feed.xml");
  });
});
