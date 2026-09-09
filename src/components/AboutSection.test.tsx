import { render, screen } from "@testing-library/react";

import { AboutSection } from "@/components/AboutSection";
import { portfolioContent } from "@/data/portfolio";

describe("AboutSection", () => {
  it("renders the owner story and principles from portfolio data", () => {
    render(<AboutSection about={portfolioContent.about} />);

    expect(screen.getByRole("heading", { name: /about/i })).toBeInTheDocument();
    expect(screen.getByText(portfolioContent.about.introduction)).toBeInTheDocument();
    expect(screen.getByText(portfolioContent.about.principles[0])).toBeInTheDocument();
  });
});
