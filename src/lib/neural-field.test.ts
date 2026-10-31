import { LOGO_BOUNDS, LOGO_HUBS, fieldNodeCount, logoGraph } from "@/lib/neural-field";

describe("logoGraph", () => {
  const { points, links } = logoGraph();

  it("keeps all seven hub nodes of the logo", () => {
    expect(points.filter((point) => point.hub)).toHaveLength(LOGO_HUBS.length);
  });

  it("shares points where edges meet instead of duplicating them", () => {
    const keys = points.map((point) => `${Math.round(point.x)},${Math.round(point.y)}`);
    expect(new Set(keys).size).toBe(points.length);
  });

  it("links only existing points and never a point to itself", () => {
    for (const [from, to] of links) {
      expect(points[from]).toBeDefined();
      expect(points[to]).toBeDefined();
      expect(from).not.toBe(to);
    }
  });

  it("stays inside the logo's bounding box", () => {
    for (const { x, y } of points) {
      expect(x).toBeGreaterThanOrEqual(LOGO_BOUNDS.x);
      expect(x).toBeLessThanOrEqual(LOGO_BOUNDS.x + LOGO_BOUNDS.width);
      expect(y).toBeGreaterThanOrEqual(LOGO_BOUNDS.y);
      expect(y).toBeLessThanOrEqual(LOGO_BOUNDS.y + LOGO_BOUNDS.height);
    }
  });

  it("uses more points when the spacing is tighter", () => {
    expect(logoGraph(40).points.length).toBeGreaterThan(points.length);
  });
});

describe("fieldNodeCount", () => {
  it("keeps phones light and desktops fuller", () => {
    expect(fieldNodeCount(390, 800)).toBeLessThanOrEqual(46);
    expect(fieldNodeCount(1440, 900)).toBeLessThanOrEqual(80);
    expect(fieldNodeCount(1440, 900)).toBeGreaterThan(fieldNodeCount(390, 800));
  });

  it("never drops below a readable minimum", () => {
    expect(fieldNodeCount(100, 100)).toBe(24);
  });
});
