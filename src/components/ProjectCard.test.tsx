import { render, screen } from "@testing-library/react";

import { ProjectCard } from "@/components/ProjectCard";
import { portfolioContent } from "@/data/portfolio";

describe("ProjectCard", () => {
  it("links a project to its stable detail route", () => {
    const project = portfolioContent.projects[0];
    render(<ProjectCard project={project} />);

    expect(screen.getByRole("link", { name: new RegExp(project.title, "i") })).toHaveAttribute("href", `/projects/${project.slug}`);
    expect(screen.getByText(project.summary)).toBeInTheDocument();
  });
});
