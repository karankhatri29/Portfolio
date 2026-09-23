import { fireEvent, render, screen, within } from "@testing-library/react";

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

  it("shows an availability badge only while open, and hides it when closed", () => {
    const { rerender } = render(<HeroSection content={portfolioContent} />);
    expect(screen.getByText(portfolioContent.availability!.label)).toBeInTheDocument();

    rerender(<HeroSection content={{ ...portfolioContent, availability: { open: false, label: "Not looking" } }} />);
    expect(screen.queryByText("Not looking")).not.toBeInTheDocument();
  });

  it("offers clear calls to action, and a booking link only when one is configured", () => {
    const { rerender } = render(<HeroSection content={portfolioContent} />);
    expect(screen.getByRole("link", { name: "Get in touch" })).toHaveAttribute("href", "#contact");
    expect(screen.getByRole("link", { name: "View resume" })).toHaveAttribute("href", "/resume");
    expect(screen.queryByRole("link", { name: "Book a call" })).not.toBeInTheDocument();

    rerender(<HeroSection content={portfolioContent} bookingUrl="https://cal.com/karan/intro" />);
    const booking = screen.getByRole("link", { name: "Book a call" });
    expect(booking).toHaveAttribute("href", "https://cal.com/karan/intro");
    expect(booking).toHaveAttribute("target", "_blank");
    expect(booking).toHaveAttribute("rel", "noopener noreferrer");
    expect(booking).toHaveAttribute("data-track", "booking");
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

  describe("interactive terminal", () => {
    beforeAll(() => {
      HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
        this.setAttribute("open", "");
      };
      HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
        this.removeAttribute("open");
        this.dispatchEvent(new Event("close"));
      };
    });

    const runInTerminal = (line: string) => {
      const input = screen.getByRole("textbox", { name: /type a command or ask a question/i });
      fireEvent.change(input, { target: { value: line } });
      fireEvent.submit(input.closest("form")!);
    };
    const log = () => within(screen.getByRole("log", { name: "Terminal output" }));

    it("keeps the typed card and adds an Ask button that opens the terminal dialog", () => {
      render(<HeroSection content={portfolioContent} />);
      expect(screen.getByRole("group", { name: "Terminal summary" })).toBeInTheDocument();
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: /open the interactive terminal/i }));

      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("lists the real projects, linked to their pages, when they are provided", () => {
      const projects = [{ slug: "email-triage", title: "Email Triage", year: "2026", summary: "s", role: "Dev", outcomes: ["o"] }];
      render(<HeroSection content={portfolioContent} projects={projects} skills={[{ id: "1", name: "AI and NLP", description: "d", tools: ["spaCy"] }]} />);
      fireEvent.click(screen.getByRole("button", { name: /open the interactive terminal/i }));

      runInTerminal("projects");
      expect(log().getByRole("link", { name: "Email Triage (2026)" })).toHaveAttribute("href", "/projects/email-triage");

      runInTerminal("skills");
      expect(log().getByText("AI and NLP: spaCy")).toBeInTheDocument();
    });

    it("falls back to the timeline's project names when no projects are provided", () => {
      render(<HeroSection content={portfolioContent} />);
      fireEvent.click(screen.getByRole("button", { name: /open the interactive terminal/i }));

      runInTerminal("projects");

      expect(log().getByText(new RegExp(portfolioContent.timeline[0].organization))).toBeInTheDocument();
    });

    it("prints contact details without a phone number", () => {
      render(<HeroSection content={portfolioContent} />);
      fireEvent.click(screen.getByRole("button", { name: /open the interactive terminal/i }));

      runInTerminal("contact");

      expect(log().getByRole("link", { name: /^Email:/ })).toBeInTheDocument();
      expect(log().getByRole("link", { name: /^GitHub:/ })).toBeInTheDocument();
      expect(screen.getByRole("log", { name: "Terminal output" }).textContent).not.toMatch(/tel:|\+91/);
    });
  });
});
