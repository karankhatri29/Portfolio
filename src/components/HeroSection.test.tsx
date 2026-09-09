import { render, screen } from "@testing-library/react";

import { HeroSection } from "@/components/HeroSection";
import { portfolioContent } from "@/data/portfolio";

describe("HeroSection", () => {
  it("renders the portfolio introduction from data", () => {
    render(<HeroSection content={portfolioContent} />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(portfolioContent.headline);
    expect(screen.getByText(portfolioContent.summary)).toBeInTheDocument();
  });
});
