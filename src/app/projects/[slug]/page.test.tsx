import { render, screen, within } from "@testing-library/react";

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

  it("tells the case study story, links out, and shows screenshots when they exist", async () => {
    mockGetProject.mockResolvedValue({
      slug: "rich",
      title: "Rich Project",
      year: "2026",
      summary: "Summary.",
      role: "Engineer",
      outcomes: ["Halved triage time"],
      stack: ["Python", "SQL"],
      githubUrl: "https://github.com/me/rich",
      liveUrl: "https://demo.example.com",
      videoUrl: "https://video.example.com/watch",
      problem: "Email overload.",
      approach: "Graph the obligations.",
      result: "Half the triage time.",
      images: [{ url: "https://cdn.example.com/a.png", alt: "Dashboard view" }],
    });

    render(await ProjectDetailPage({ params: Promise.resolve({ slug: "rich" }) }));

    for (const [heading, text] of [["The problem", "Email overload."], ["The approach", "Graph the obligations."], ["The result", "Half the triage time."]]) {
      expect(within(screen.getByRole("heading", { name: heading }).closest("section")!).getByText(text)).toBeInTheDocument();
    }
    const links = screen.getByRole("navigation", { name: "Project links" });
    expect(within(links).getByRole("link", { name: "Live demo" })).toHaveAttribute("href", "https://demo.example.com");
    expect(within(links).getByRole("link", { name: "Watch the demo" })).toHaveAttribute("rel", "noopener noreferrer");
    expect(within(links).getByRole("link", { name: "View on GitHub" })).toHaveAttribute("href", "https://github.com/me/rich");
    expect(screen.getByRole("img", { name: "Dashboard view" })).toHaveAttribute("src", "https://cdn.example.com/a.png");
    expect(screen.getByRole("list", { name: "Technologies used" })).toHaveTextContent("Python");
    expect(screen.getByRole("link", { name: "All projects" })).toHaveAttribute("href", "/#projects");
  });

  it("leaves out empty sections for a simple project", async () => {
    mockGetProject.mockResolvedValue({ slug: "plain", title: "Plain", year: "2026", summary: "s", role: "r", outcomes: ["o"], stack: [], images: [] });

    render(await ProjectDetailPage({ params: Promise.resolve({ slug: "plain" }) }));

    for (const name of ["The problem", "The approach", "The result"]) expect(screen.queryByRole("heading", { name })).not.toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Project links" })).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Screenshots" })).not.toBeInTheDocument();
  });

  it("responds with not found for an unknown slug", async () => {
    mockGetProject.mockResolvedValue(undefined);

    await expect(ProjectDetailPage({ params: Promise.resolve({ slug: "missing-project" }) })).rejects.toMatchObject({
      digest: expect.stringContaining("404"),
    });
  });
});
