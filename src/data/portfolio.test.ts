import { portfolioContent } from "@/data/portfolio";

describe("portfolio content", () => {
  it("contains the static public sections needed by the page", () => {
    expect(portfolioContent.timeline.length).toBeGreaterThan(0);
    expect(portfolioContent.contactLinks.length).toBeGreaterThan(0);
    expect(portfolioContent.about.principles.length).toBeGreaterThan(0);
  });
});
