import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import ResumePage from "@/app/resume/page";
import { portfolioContent } from "@/data/portfolio";
import { listProjects, listSkills } from "@/lib/content/repository";

jest.mock("@/lib/content/repository", () => ({ listProjects: jest.fn(), listSkills: jest.fn() }));

const mockProjects = jest.mocked(listProjects);
const mockSkills = jest.mocked(listSkills);

beforeEach(() => {
  mockProjects.mockResolvedValue([{ slug: "alpha", title: "Alpha Project", year: "2026", summary: "Built alpha.", role: "Engineer", outcomes: ["Cut latency by half"], stack: ["Python", "SQL"] }]);
  mockSkills.mockResolvedValue([{ id: "s1", name: "Data", description: "Data work", tools: ["Pandas", "NumPy"] }]);
});

describe("resume page", () => {
  it("presents the whole resume: contact, experience, projects, skills, education and leadership", async () => {
    render(await ResumePage());

    expect(screen.getByRole("heading", { level: 1, name: portfolioContent.name })).toBeInTheDocument();
    const experience = screen.getByRole("heading", { name: "Experience" }).closest("section")!;
    expect(within(experience).getAllByRole("listitem")).toHaveLength(portfolioContent.timeline.length);
    expect(screen.getByText("Alpha Project")).toBeInTheDocument();
    expect(screen.getByText("Cut latency by half")).toBeInTheDocument();
    expect(screen.getByText("Stack: Python, SQL")).toBeInTheDocument();
    expect(screen.getByText("Pandas, NumPy")).toBeInTheDocument();
    for (const name of ["Education", "Recognition and certifications", "Leadership"]) {
      expect(screen.getByRole("heading", { name })).toBeInTheDocument();
    }
    expect(screen.getByText(/karankhatri2924@gmail.com/)).toBeInTheDocument();
  });

  it("still renders the static parts when the database is unavailable", async () => {
    mockProjects.mockRejectedValue(new Error("db down"));
    mockSkills.mockRejectedValue(new Error("db down"));

    render(await ResumePage());

    expect(screen.getByRole("heading", { name: "Experience" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Projects" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Skills" })).not.toBeInTheDocument();
  });

  it("offers a way back and prints on request, with screen-only controls hidden when printing", async () => {
    const print = jest.spyOn(window, "print").mockImplementation(() => {});
    const user = userEvent.setup();
    render(await ResumePage());

    expect(screen.getByRole("link", { name: "Back to site" })).toHaveAttribute("href", "/");
    const button = screen.getByRole("button", { name: "Save as PDF" });
    expect(button).toHaveClass("print:hidden");
    await user.click(button);
    expect(print).toHaveBeenCalledTimes(1);
    print.mockRestore();
  });
});
