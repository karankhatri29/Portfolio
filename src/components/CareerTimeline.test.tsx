import { render, screen } from "@testing-library/react";

import { CareerTimeline } from "@/components/CareerTimeline";
import { portfolioContent } from "@/data/portfolio";

describe("CareerTimeline", () => {
  it("renders milestones in the supplied chronological order", () => {
    render(<CareerTimeline items={portfolioContent.timeline} />);

    const years = screen.getAllByRole("term");
    expect(years).toHaveLength(portfolioContent.timeline.length);
    expect(years[0]).toHaveTextContent("2024 - now");
    expect(screen.getByText("Independent engineer")).toBeInTheDocument();
  });
});
