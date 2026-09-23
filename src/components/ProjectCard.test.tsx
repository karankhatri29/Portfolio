import { render, screen } from "@testing-library/react";

import { ProjectCard } from "@/components/ProjectCard";
import type { Project } from "@/lib/content/repository";

const project: Project = {
  slug: "test-project",
  title: "Test Project",
  year: "2026",
  summary: "A project used in tests.",
  role: "Engineer",
  outcomes: ["Shipped a thing"],
};

describe("ProjectCard", () => {
  it("links a project to its stable detail route", () => {
    render(<ProjectCard project={project} />);

    expect(screen.getByRole("link", { name: new RegExp(project.title, "i") })).toHaveAttribute("href", `/projects/${project.slug}`);
    expect(screen.getByText(project.summary)).toBeInTheDocument();
  });
});
