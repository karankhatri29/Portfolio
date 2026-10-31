import { fireEvent, render, screen, within } from "@testing-library/react";

import { HeroSection } from "@/components/HeroSection";
import { portfolioContent } from "@/data/portfolio";

describe("HeroSection", () => {
  it("renders the portfolio introduction from data", () => {
    render(<HeroSection content={portfolioContent} />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(portfolioContent.name);
    expect(screen.getByText(portfolioContent.headline.split(/(?<=\.)\s+/).slice(1).join(" "))).toBeInTheDocument();
    expect(screen.getByText(portfolioContent.tagline ?? portfolioContent.summary)).toBeInTheDocument();
  });

  it("shows the plain summary when there is no catchy tagline", () => {
    render(<HeroSection content={{ ...portfolioContent, tagline: undefined }} />);

    expect(screen.getByText(portfolioContent.summary)).toBeInTheDocument();
  });

  it("shows the student-to-builder line as a path that ends at the role", () => {
    render(<HeroSection content={portfolioContent} />);

    const steps = within(screen.getByRole("list", { name: "Path" })).getAllByRole("listitem");
    expect(steps.map((step) => step.textContent)).toEqual(["Integrated M.Tech CSE student", "builder", "AI engineer"]);
  });

  it("copes with a headline of a single sentence", () => {
    render(<HeroSection content={{ ...portfolioContent, headline: "One sentence only." }} />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(portfolioContent.name);
    expect(within(screen.getByRole("list", { name: "Path" })).getByText("One sentence only")).toBeInTheDocument();
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

describe("HeroSection layout", () => {
  it("shows the typing terminal card, and opens the full terminal from it", () => {
    render(<HeroSection content={portfolioContent} />);

    const card = screen.getByRole("group", { name: "Terminal summary" });
    expect(card.closest(".sr-only")).toBeNull();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    fireEvent.click(card);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("uses the transparent cutout portrait", () => {
    render(<HeroSection content={portfolioContent} />);

    expect(screen.getByRole("img", { name: /Karan Kaushik Khatri smiling/ }).getAttribute("src")).toContain("karan-khatri-cutout");
  });

  it("does not label skills around the portrait", () => {
    const skills = ["Python", "NLP"].map((name, index) => ({ id: String(index), name, description: "", tools: [] }));
    render(<HeroSection content={portfolioContent} skills={skills} />);

    expect(screen.queryByText("Python")).not.toBeInTheDocument();
    expect(screen.queryByText("NLP")).not.toBeInTheDocument();
  });
});

describe("HeroSection terminal card", () => {
  it("never tells visitors to click: no label, just a realistic session and one accessible control over the card", () => {
    render(<HeroSection content={portfolioContent} />);

    expect(screen.queryByText("Ask")).not.toBeInTheDocument();
    const control = screen.getByRole("button", { name: /open the interactive terminal/i });
    expect(control).toBeEmptyDOMElement();
    expect(control.className).toContain("inset-0");
  });

  it("shows a shell prompt before every command", () => {
    const { container } = render(<HeroSection content={portfolioContent} />);

    const prompts = [...container.querySelectorAll("[role='group'] span")].filter((node) => node.textContent === "karan@k3:~$");
    expect(prompts.length).toBeGreaterThanOrEqual(portfolioContent.terminal.length);
  });

  it("keeps the hanging commands short enough to fit the card", () => {
    for (const command of portfolioContent.terminalTeasers ?? []) expect(command.length).toBeLessThanOrEqual(24);
    expect((portfolioContent.terminalTeasers ?? []).length).toBeGreaterThan(1);
  });
});

describe("HeroSection structure", () => {
  it("keeps the real name as the heading's accessible name, whatever the reveal animation does", () => {
    render(<HeroSection content={portfolioContent} />);

    expect(screen.getByRole("heading", { level: 1, name: portfolioContent.name })).toBeInTheDocument();
  });

  it("puts the name and portrait first, with the path and availability after the buttons", () => {
    const { container } = render(<HeroSection content={portfolioContent} />);
    const position = (node: Element | null) => (node ? Array.from(container.querySelectorAll("*")).indexOf(node) : -1);

    const heading = container.querySelector("h1");
    const buttons = screen.getByRole("link", { name: "Get in touch" });
    const path = screen.getByRole("list", { name: "Path" });
    const availability = screen.getByText(portfolioContent.availability!.label);
    expect(position(heading)).toBeLessThan(position(buttons));
    expect(position(buttons)).toBeLessThan(position(path));
    expect(position(path)).toBeLessThan(position(availability));
  });

  it("reveals each name line with the CSS animation, one after another", () => {
    const { container } = render(<HeroSection content={portfolioContent} />);

    const delays = [...container.querySelectorAll<HTMLElement>(".name-in")].map((line) => parseInt(line.style.getPropertyValue("--delay"), 10));
    expect(delays).toHaveLength(portfolioContent.name.split(" ").length);
    expect([...delays].sort((a, b) => a - b)).toEqual(delays);
    expect(new Set(delays).size).toBe(delays.length);
  });
});

describe("HeroSection terminal answers", () => {
  const openAndRun = (command: string) => {
    render(<HeroSection content={portfolioContent} />);
    fireEvent.click(screen.getByRole("button", { name: /open the interactive terminal/i }));
    const box = screen.getByRole("textbox", { name: /type a command or ask a question/i });
    fireEvent.change(box, { target: { value: command } });
    fireEvent.submit(box.closest("form")!);
    return within(screen.getByRole("log", { name: "Terminal output" }));
  };

  it("whoami says who Karan is rather than repeating the hero", () => {
    const output = openAndRun("whoami");

    expect(output.getByText(portfolioContent.about.introduction)).toBeInTheDocument();
    expect(output.getByText(/^Now: /)).toBeInTheDocument();
    expect(output.getByText(`Availability: ${portfolioContent.availability!.label}`)).toBeInTheDocument();
  });

  it("projects says what each project is, from the page's own data", () => {
    const output = openAndRun("projects");

    const first = portfolioContent.timeline[0];
    expect(output.getByText(new RegExp(first.summary.slice(0, 30)))).toBeInTheDocument();
  });
});

describe("HeroSection terminal with no projects loaded", () => {
  it("falls back to the timeline when the project list is empty, so projects still has something real to say", () => {
    render(<HeroSection content={portfolioContent} projects={[]} />);
    fireEvent.click(screen.getByRole("button", { name: /open the interactive terminal/i }));
    const box = screen.getByRole("textbox", { name: /type a command or ask a question/i });
    fireEvent.change(box, { target: { value: "projects" } });
    fireEvent.submit(box.closest("form")!);

    const output = within(screen.getByRole("log", { name: "Terminal output" }));
    expect(output.queryByText("No projects listed yet.")).not.toBeInTheDocument();
    expect(output.getByText(new RegExp(portfolioContent.timeline[0].organization.slice(0, 20)))).toBeInTheDocument();
  });
});
