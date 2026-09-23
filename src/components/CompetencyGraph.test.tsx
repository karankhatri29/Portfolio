import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { CompetencyGraph } from "@/components/CompetencyGraph";
import type { Project, SkillRecord } from "@/lib/content/repository";
import { buildSkillGraph } from "@/lib/skills/graph";

const skills: SkillRecord[] = [
  { id: "s1", name: "AI and NLP", description: "Extracts intent from text.", tools: ["spaCy", "NLTK"] },
  { id: "s2", name: "Databases", description: "Stores and queries data.", tools: ["SQLite"] },
];
const projects: Project[] = [
  { slug: "triage", title: "Email Triage", year: "2026", summary: "Triage pipeline.", role: "Backend developer", outcomes: ["Live Gmail ingestion"], stack: ["spaCy", "SQLite"] },
];
const graph = buildSkillGraph(skills, projects);

function setup() {
  render(<CompetencyGraph graph={graph} skills={skills} projects={projects} />);
  const svg = screen.getByRole("group", { name: /skills knowledge graph/i });
  return { svg, node: (name: RegExp) => within(svg).getByRole("button", { name }) };
}

describe("CompetencyGraph", () => {
  it("draws every competency, project and listed tool as a node", () => {
    const { node } = setup();

    for (const name of [/AI and NLP/, /Databases/, /Email Triage/, /spaCy/, /NLTK/, /SQLite/]) expect(node(name)).toBeInTheDocument();
  });

  it("summarises the size of the skill set", () => {
    setup();

    expect(screen.getByText("Shipped in projects").previousElementSibling).toHaveTextContent("2");
    expect(screen.getByText("Tools").previousElementSibling).toHaveTextContent("3");
  });

  it("starts with an overview listing each competency", () => {
    setup();

    const evidence = screen.getByRole("complementary", { name: "Evidence" });
    expect(within(evidence).getByText("Extracts intent from text.")).toBeInTheDocument();
  });

  it("shows the evidence for a selected competency and clears it with Escape", async () => {
    const user = userEvent.setup();
    const { node } = setup();

    await user.click(node(/AI and NLP/));
    const evidence = screen.getByRole("complementary", { name: "Evidence" });
    expect(node(/AI and NLP/)).toHaveAttribute("aria-pressed", "true");
    expect(within(evidence).getByRole("link", { name: "Email Triage" })).toHaveAttribute("href", "/projects/triage");
    expect(within(evidence).getByText(/spaCy · Backend developer/)).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(node(/AI and NLP/)).toHaveAttribute("aria-pressed", "false");
  });

  it("selects a node from the keyboard", async () => {
    const user = userEvent.setup();
    const { node } = setup();

    node(/Email Triage/).focus();
    await user.keyboard("{Enter}");

    const evidence = screen.getByRole("complementary", { name: "Evidence" });
    expect(within(evidence).getByText("Live Gmail ingestion")).toBeInTheDocument();
  });

  it("lets a tool chip in the evidence panel jump to that tool", async () => {
    const user = userEvent.setup();
    const { node } = setup();

    await user.click(node(/AI and NLP/));
    await user.click(within(screen.getByRole("complementary", { name: "Evidence" })).getByRole("button", { name: "spaCy" }));

    expect(node(/spaCy/)).toHaveAttribute("aria-pressed", "true");
  });

  it("offers an expandable list for small screens", async () => {
    const user = userEvent.setup();
    setup();

    const toggle = screen.getByRole("button", { name: /^Databases$/ });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
  });
});
