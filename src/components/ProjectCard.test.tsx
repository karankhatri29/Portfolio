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
  stack: ["Python", "spaCy", "NetworkX", "SQLite", "Docker", "Azure", "Vercel"],
  githubUrl: "https://github.com/example/test-project",
};

describe("ProjectCard", () => {
  it("links a project to its stable detail route", () => {
    render(<ProjectCard project={project} />);

    expect(screen.getByRole("link", { name: "View Test Project project" })).toHaveAttribute("href", `/projects/${project.slug}`);
    expect(screen.getByText(project.summary)).toBeInTheDocument();
  });

  it("links the repository from a GitHub icon in the top right, opening in a new tab", () => {
    render(<ProjectCard project={project} />);

    const github = screen.getByRole("link", { name: "Test Project on GitHub" });
    expect(github).toHaveAttribute("href", project.githubUrl);
    expect(github).toHaveAttribute("target", "_blank");
    expect(github).toHaveAttribute("rel", "noopener noreferrer");
    expect(github.querySelector("svg")).toBeInTheDocument();
  });

  it("falls back to the GitHub profile when no repository link is set", () => {
    render(<ProjectCard project={{ ...project, githubUrl: undefined }} fallbackGithubUrl="https://github.com/example" />);

    expect(screen.getByRole("link", { name: "GitHub profile" })).toHaveAttribute("href", "https://github.com/example");
  });

  it("shows no GitHub icon when neither a repository nor a profile is available", () => {
    render(<ProjectCard project={{ ...project, githubUrl: undefined }} />);

    expect(screen.queryByRole("link", { name: /github/i })).not.toBeInTheDocument();
  });

  it("shows the first five stack items and counts the rest", () => {
    render(<ProjectCard project={project} />);

    const stack = screen.getByRole("list", { name: "Stack for Test Project" });
    expect(stack).toHaveTextContent("Python");
    expect(stack).toHaveTextContent("+2");
    expect(stack).not.toHaveTextContent("Vercel");
  });
});
