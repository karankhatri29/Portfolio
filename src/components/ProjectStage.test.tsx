import { act, render, screen } from "@testing-library/react";

import { ProjectStage } from "@/components/ProjectStage";
import type { Project } from "@/lib/content/repository";

const projects: Project[] = [
  { slug: "triage", title: "Email Triage", year: "2026", summary: "Triages Gmail.", role: "Backend developer", outcomes: [], stack: ["Python", "spaCy"], githubUrl: "https://github.com/me/triage" },
  { slug: "market", title: "Marketplace", year: "2025", summary: "An NFT marketplace.", role: "Blockchain developer", outcomes: [], stack: ["Solidity"] },
];

let observed: { callback: IntersectionObserverCallback; targets: Element[] };

beforeEach(() => {
  observed = { callback: () => {}, targets: [] };
  class FakeObserver {
    constructor(callback: IntersectionObserverCallback) { observed.callback = callback; }
    observe(target: Element) { observed.targets.push(target); }
    disconnect() {}
    unobserve() {}
    takeRecords() { return []; }
  }
  (global as unknown as { IntersectionObserver: unknown }).IntersectionObserver = FakeObserver;
});

describe("ProjectStage", () => {
  it("lists every project with its summary, stack and links", () => {
    render(<ProjectStage projects={projects} fallbackGithubUrl="https://github.com/me" />);

    expect(screen.getByRole("heading", { level: 2, name: "Selected work" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Email Triage" })).toBeInTheDocument();
    expect(screen.getByText("Triages Gmail.")).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "Stack for Email Triage" })).toHaveTextContent("spaCy");
    expect(screen.getByRole("link", { name: "View Email Triage project" })).toHaveAttribute("href", "/projects/triage");
    expect(screen.getByRole("link", { name: "Email Triage on GitHub" })).toHaveAttribute("href", "https://github.com/me/triage");
  });

  it("falls back to the GitHub profile for projects without their own repository", () => {
    render(<ProjectStage projects={projects} fallbackGithubUrl="https://github.com/me" />);

    expect(screen.getByRole("link", { name: "GitHub profile" })).toHaveAttribute("href", "https://github.com/me");
  });

  it("shows the first project in focus, and switches when another crosses the middle of the screen", () => {
    const { container } = render(<ProjectStage projects={projects} />);
    const focus = () => container.querySelector("[aria-hidden='true'] .timeline-fade");
    expect(focus()).toHaveTextContent("Email Triage");
    expect(focus()).toHaveTextContent("2026");

    const second = observed.targets[1];
    act(() => observed.callback([{ isIntersecting: true, target: second } as unknown as IntersectionObserverEntry], {} as IntersectionObserver));

    expect(focus()).toHaveTextContent("Marketplace");
    expect(focus()).toHaveTextContent("2025");
  });

  it("says projects are coming soon when there are none", () => {
    render(<ProjectStage projects={[]} />);

    expect(screen.getByText("Projects coming soon.")).toBeInTheDocument();
  });
});
