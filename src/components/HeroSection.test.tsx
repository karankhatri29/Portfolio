import { render, screen, within } from "@testing-library/react";

import { HeroSection } from "@/components/HeroSection";
import { portfolioContent } from "@/data/portfolio";

describe("HeroSection", () => {
  it("renders the portfolio introduction from data", () => {
    render(<HeroSection content={portfolioContent} />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(portfolioContent.headline);
    expect(screen.getByText(portfolioContent.summary)).toBeInTheDocument();
  });

  it("puts the role on its own line ahead of the claim, without changing the headline text", () => {
    render(<HeroSection content={portfolioContent} />);

    const heading = screen.getByRole("heading", { level: 1 });
    expect(within(heading).getByText("AI engineer.")).toHaveClass("block");
    expect(heading).toHaveTextContent("AI engineer. I make language models useful on real, messy data.");
  });

  it("falls back to the plain headline when it has a single sentence", () => {
    render(<HeroSection content={{ ...portfolioContent, headline: "One sentence only." }} />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("One sentence only.");
  });

  it("shows a described portrait", () => {
    render(<HeroSection content={portfolioContent} />);

    const portrait = screen.getByRole("img", { name: /Karan Kaushik Khatri smiling/ });
    expect(portrait.getAttribute("src")).toContain("karan-khatri");
  });

  it("keeps the terminal text in the page for screen readers and no-JS visitors", () => {
    render(<HeroSection content={portfolioContent} />);

    const terminal = screen.getByRole("group", { name: "Terminal summary" });
    for (const line of portfolioContent.terminal) {
      expect(within(terminal).getByText(line.command)).toBeInTheDocument();
      expect(within(terminal).getByText(line.output)).toBeInTheDocument();
    }
  });

  it("gives every terminal line a typing length and delay that stay in order", () => {
    render(<HeroSection content={portfolioContent} />);

    const terminal = screen.getByRole("group", { name: "Terminal summary" });
    const lines = [...terminal.querySelectorAll<HTMLElement>(".term-line")];
    expect(lines).toHaveLength(portfolioContent.terminal.length * 2);

    const delays = lines.map((line) => parseInt(line.style.getPropertyValue("--delay"), 10));
    expect([...delays].sort((a, b) => a - b)).toEqual(delays);
    lines.forEach((line) => expect(Number(line.style.getPropertyValue("--n"))).toBe(line.textContent?.length));
  });

  it("keeps terminal lines short enough to fit the card", () => {
    for (const line of portfolioContent.terminal) {
      expect(line.command.length).toBeLessThanOrEqual(30);
      expect(line.output.length).toBeLessThanOrEqual(32);
    }
  });
});
