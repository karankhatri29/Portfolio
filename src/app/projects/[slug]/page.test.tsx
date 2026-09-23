import { render, screen } from "@testing-library/react";

import ProjectDetailPage from "@/app/projects/[slug]/page";
import { getProject } from "@/lib/content/repository";

jest.mock("@/lib/content/repository", () => ({ getProject: jest.fn() }));

const mockGetProject = jest.mocked(getProject);

describe("project detail route", () => {
  it("renders an existing project loaded by slug", async () => {
    mockGetProject.mockResolvedValue({
      slug: "test-project",
      title: "Test Project",
      year: "2026",
      summary: "A project used in tests.",
      role: "Engineer",
      outcomes: ["Shipped a thing"],
    });

    render(await ProjectDetailPage({ params: Promise.resolve({ slug: "test-project" }) }));

    expect(mockGetProject).toHaveBeenCalledWith("test-project");
    expect(screen.getByRole("heading", { level: 1, name: "Test Project" })).toBeInTheDocument();
    expect(screen.getByText("Shipped a thing")).toBeInTheDocument();
  });

  it("responds with not found for an unknown slug", async () => {
    mockGetProject.mockResolvedValue(undefined);

    await expect(ProjectDetailPage({ params: Promise.resolve({ slug: "missing-project" }) })).rejects.toMatchObject({
      digest: expect.stringContaining("404"),
    });
  });
});
