import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import ResumePage from "@/app/resume/page";
import { resume } from "@/data/resume";

const section = (name: string) => within(screen.getByRole("heading", { name }).closest("section")!);

describe("resume page", () => {
  it("presents every section of the resume document", () => {
    render(<ResumePage />);

    expect(screen.getByRole("heading", { level: 1, name: resume.name })).toBeInTheDocument();
    for (const name of ["Education", "Technical skills", "Projects & experience", "Research papers", "Achievements & certifications", "Leadership roles"]) {
      expect(screen.getByRole("heading", { level: 2, name })).toBeInTheDocument();
    }
  });

  it("shows the contact line with working links", () => {
    render(<ResumePage />);

    expect(screen.getByText(/Hyderabad, India/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "github.com/karankhatri29" })).toHaveAttribute("href", "https://github.com/karankhatri29");
    expect(screen.getByRole("link", { name: "LinkedIn" })).toHaveAttribute("rel", "noopener noreferrer");
    expect(screen.getByRole("link", { name: "karankhatri2924@gmail.com" })).toHaveAttribute("href", "mailto:karankhatri2924@gmail.com");
  });

  it("does not publish a phone number", () => {
    const { container } = render(<ResumePage />);

    expect(container.textContent).not.toMatch(/\+91|\d{10}/);
  });

  it("lists both degrees with their scores", () => {
    render(<ResumePage />);

    const education = section("Education");
    expect(education.getByText("Vellore Institute of Technology, Vellore")).toBeInTheDocument();
    expect(education.getByText(/CGPA: 9\.42/)).toBeInTheDocument();
    expect(education.getByText(/Percentage: 97\.6/)).toBeInTheDocument();
    expect(education.getByText("2022 – 2027")).toBeInTheDocument();
  });

  it("lists every skill category with its tools", () => {
    render(<ResumePage />);

    const skills = section("Technical skills");
    expect(skills.getAllByRole("listitem")).toHaveLength(resume.skills.length);
    expect(skills.getByText("Knowledge graphs & agentic tools")).toBeInTheDocument();
    expect(skills.getByText(/NetworkX \(graph construction & analysis\), LangChain/)).toBeInTheDocument();
  });

  it("shows each project with its role, period, tech stack and bullets", () => {
    render(<ResumePage />);

    const experience = section("Projects & experience");
    for (const entry of resume.experience) {
      expect(experience.getByText(`${entry.title} – ${entry.role}`)).toBeInTheDocument();
      expect(experience.getByText(entry.period)).toBeInTheDocument();
      expect(experience.getByText(`Tech stack: ${entry.stack}`)).toBeInTheDocument();
      for (const bullet of entry.bullets) expect(experience.getByText(bullet)).toBeInTheDocument();
    }
    expect(experience.getByText(/topological ordering and degree-centrality/)).toBeInTheDocument();
    expect(experience.getByText(/~90% piracy risk reduction/)).toBeInTheDocument();
  });

  it("lists the research papers, the hackathon result, certifications and leadership roles", () => {
    render(<ResumePage />);

    for (const paper of resume.papers) expect(section("Research papers").getByText(paper)).toBeInTheDocument();
    const achievements = section("Achievements & certifications");
    expect(achievements.getByText(/Caterpillar Hackathon – Finalist/)).toBeInTheDocument();
    expect(achievements.getByText(/reducing inspection time by 45%/)).toBeInTheDocument();
    expect(achievements.getByText(/DBMS Certification \(Infosys Springboard\) \| Azure AI Fundamentals \(Microsoft\) \| Scrum – Agile \(TCS\)/)).toBeInTheDocument();
    for (const line of resume.leadership) expect(section("Leadership roles").getByText(line)).toBeInTheDocument();
  });

  it("offers a way back and prints on request, with screen-only controls hidden when printing", async () => {
    const print = jest.spyOn(window, "print").mockImplementation(() => {});
    const user = userEvent.setup();
    render(<ResumePage />);

    expect(screen.getByRole("link", { name: "Back to site" })).toHaveAttribute("href", "/");
    const button = screen.getByRole("button", { name: "Save as PDF" });
    expect(button).toHaveClass("print:hidden");
    await user.click(button);
    expect(print).toHaveBeenCalledTimes(1);
    print.mockRestore();
  });
});
