import { portfolioContent } from "@/data/portfolio";

describe("portfolio content", () => {
  it("contains the public sections and data needed by the page", () => {
    expect(portfolioContent.timeline.length).toBeGreaterThan(0);
    expect(portfolioContent.competencies.length).toBeGreaterThan(0);
    expect(portfolioContent.projects.every((project) => project.slug)).toBe(true);
    expect(portfolioContent.contactLinks.length).toBeGreaterThan(0);
  });

  it("keeps project slugs unique for dynamic routing", () => {
    const slugs = portfolioContent.projects.map((project) => project.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});
