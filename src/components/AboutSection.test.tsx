import { render, screen, within } from "@testing-library/react";

import { AboutSection } from "@/components/AboutSection";
import { portfolioContent } from "@/data/portfolio";

const { about } = portfolioContent;
const now = new Date(2026, 8, 23); // final year of the degree

describe("AboutSection", () => {
  it("renders the owner story and principles from portfolio data", () => {
    render(<AboutSection about={about} now={now} />);

    expect(screen.getByRole("heading", { name: /about/i })).toBeInTheDocument();
    expect(screen.getByText(about.introduction)).toBeInTheDocument();
    expect(screen.getByText(about.principles[0])).toBeInTheDocument();
  });

  it("shows the headline figures with readable labels", () => {
    render(<AboutSection about={about} now={now} />);

    const highlights = within(screen.getByRole("list", { name: "Highlights" }));
    expect(highlights.getAllByRole("listitem")).toHaveLength(about.stats.length);
    for (const stat of about.stats) {
      expect(highlights.getByText(stat.label)).toBeInTheDocument();
      expect(highlights.getByText(stat.detail)).toBeInTheDocument();
    }
    expect(highlights.getAllByText("9.42").length).toBeGreaterThan(0);
    expect(highlights.getAllByText("45%").length).toBeGreaterThan(0);
  });

  it("backs each principle with a link to the evidence", () => {
    render(<AboutSection about={about} now={now} />);

    const principles = within(screen.getByRole("list", { name: "Working principles" })).getAllByRole("listitem");
    expect(principles).toHaveLength(about.principles.length);
    for (const item of principles) expect(within(item).getByRole("link")).toBeInTheDocument();

    const first = within(principles[0]).getByRole("link");
    expect(first).toHaveAttribute("href", "/projects/context-aware-recommendation-engine");
    expect(first).toHaveTextContent("Context-Aware Recommendation Engine");
    expect(within(principles[3]).getByRole("link")).toHaveAttribute("href", "#credentials");
  });

  it("only points principles at projects that exist in the portfolio data", () => {
    const known = new Set(["edge-native-email-triage", "context-aware-recommendation-engine", "blockchain-marketplace", "smart-data-compression"]);
    for (const { href, principle } of about.proof) {
      expect(about.principles).toContain(principle);
      if (href.startsWith("/projects/")) expect(known.has(href.replace("/projects/", ""))).toBe(true);
    }
  });

  it("shows how far through the degree you are, and updates with the date", () => {
    const { rerender } = render(<AboutSection about={about} now={now} />);
    expect(screen.getByRole("img", { name: /Final year \(5 of 5\)/ })).toHaveAccessibleName(/8[5-7]% of the way through 2022 to 2027/);

    rerender(<AboutSection about={about} now={new Date(2024, 0, 15)} />);
    expect(screen.getByRole("img", { name: /Year 2 of 5/ })).toBeInTheDocument();
  });

  it("omits the progress bar when the degree dates are invalid", () => {
    render(<AboutSection about={{ ...about, degree: { ...about.degree, start: "soon" } }} now={now} />);

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByText(about.degree.institution)).toBeInTheDocument();
  });

  it("lists recognition, certifications, leadership and earlier education", () => {
    render(<AboutSection about={about} now={now} />);

    for (const item of [...about.recognition, ...about.certifications, ...about.leadership, ...about.education]) expect(screen.getByText(item)).toBeInTheDocument();
    expect(document.getElementById("credentials")).toBeInTheDocument();
  });
});
