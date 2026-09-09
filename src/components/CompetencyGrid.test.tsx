import { render, screen } from "@testing-library/react";

import { CompetencyGrid } from "@/components/CompetencyGrid";
import { portfolioContent } from "@/data/portfolio";

describe("CompetencyGrid", () => {
  it("renders every competency as a named item", () => {
    render(<CompetencyGrid items={portfolioContent.competencies} />);

    expect(screen.getByRole("heading", { name: /core competencies/i })).toBeInTheDocument();
    for (const competency of portfolioContent.competencies) {
      expect(screen.getByRole("heading", { name: competency.name })).toBeInTheDocument();
    }
  });
});
