import { getProjectBySlug } from "@/app/projects/[slug]/page";

describe("project detail route data", () => {
  it("resolves an existing project by slug", () => {
    expect(getProjectBySlug("calm-operations")?.title).toBe("Calm Operations");
  });

  it("returns no project for an unknown slug", () => {
    expect(getProjectBySlug("missing-project")).toBeUndefined();
  });
});
