import { render, screen } from "@testing-library/react";

import { CompetencyGrid } from "@/components/CompetencyGrid";
import type { SkillRecord } from "@/lib/content/repository";

const skills: SkillRecord[] = [
  { id: "skill-1", name: "Python and data", description: "Python, Pandas, and NumPy." },
  { id: "skill-2", name: "Web development", description: "React and Node.js." },
];

describe("CompetencyGrid", () => {
  it("renders every competency as a named item", () => {
    render(<CompetencyGrid items={skills} />);

    expect(screen.getByRole("heading", { name: /core competencies/i })).toBeInTheDocument();
    for (const skill of skills) {
      expect(screen.getByRole("heading", { name: skill.name })).toBeInTheDocument();
    }
  });

  it("shows a placeholder when there are no competencies", () => {
    render(<CompetencyGrid items={[]} />);

    expect(screen.getByText("Competencies coming soon.")).toBeInTheDocument();
  });
});
