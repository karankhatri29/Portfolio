import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { AdminGate } from "@/components/AdminGate";
import { ContentEditor } from "@/components/ContentEditor";
import type { Project, SkillRecord } from "@/lib/content/repository";

const project: Project = {
  slug: "existing-project",
  title: "Existing Project",
  year: "2025",
  summary: "Already in the database.",
  role: "Engineer",
  outcomes: ["First outcome", "Second outcome"],
};

const skill: SkillRecord = { id: "skill-1", name: "Existing Skill", description: "Already in the database." };

const adminSession = { user: { email: "owner@example.com" }, role: "Admin" as const };
const visitorSession = { user: { email: "visitor@example.com" }, role: "Visitor" as const };

const fetchMock = jest.fn();

function reply(status: number, body: unknown) {
  return Promise.resolve({ ok: status >= 200 && status < 300, status, json: async () => body });
}

function renderEditor() {
  return render(<ContentEditor initialProjects={[project]} initialSkills={[skill]} />);
}

async function fillProjectForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Slug"), "new-project");
  await user.type(screen.getByLabelText("Project title"), "New Project");
  await user.type(screen.getByLabelText("Year"), "2026");
  await user.type(screen.getByLabelText("Role"), "Builder");
  await user.type(screen.getByLabelText("Summary"), "Brand new.");
  await user.type(screen.getByLabelText("Outcomes (one per line)"), "Did a thing{enter}Did another");
}

beforeEach(() => {
  fetchMock.mockReset();
  global.fetch = fetchMock as unknown as typeof fetch;
});

describe("ContentEditor visibility", () => {
  it("renders editing controls for an Admin session", () => {
    render(<AdminGate session={adminSession}><ContentEditor initialProjects={[project]} initialSkills={[skill]} /></AdminGate>);

    expect(screen.getByRole("form", { name: "New project" })).toBeInTheDocument();
    expect(screen.getByRole("form", { name: "New competency" })).toBeInTheDocument();
  });

  it.each([
    ["a Visitor", visitorSession],
    ["a signed-out user", null],
  ])("does not render editing controls for %s", (_label, session) => {
    render(<AdminGate session={session}><ContentEditor initialProjects={[project]} initialSkills={[skill]} /></AdminGate>);

    expect(screen.queryByRole("form", { name: "New project" })).not.toBeInTheDocument();
    expect(screen.queryByText("Existing Project")).not.toBeInTheDocument();
  });
});

describe("project editing", () => {
  it("shows a pending state, then success, and adds the created project to the list", async () => {
    const user = userEvent.setup();
    let resolveRequest: (value: unknown) => void = () => {};
    fetchMock.mockReturnValue(new Promise((resolve) => { resolveRequest = resolve; }));
    renderEditor();

    await fillProjectForm(user);
    await user.click(screen.getByRole("button", { name: "Create project" }));

    expect(await screen.findByText("Saving...")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create project" })).toBeDisabled();

    const created = { ...project, slug: "new-project", title: "New Project", year: "2026", role: "Builder", summary: "Brand new.", outcomes: ["Did a thing", "Did another"] };
    resolveRequest({ ok: true, status: 201, json: async () => ({ project: created }) });

    expect(await screen.findByText("Project created.")).toBeInTheDocument();
    expect(screen.getByText("New Project")).toBeInTheDocument();

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/projects");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toMatchObject({ slug: "new-project", title: "New Project", year: "2026", role: "Builder", summary: "Brand new.", outcomes: ["Did a thing", "Did another"], stack: [], githubUrl: "" });
  });

  it("shows validation errors from the server and keeps the list unchanged", async () => {
    const user = userEvent.setup();
    fetchMock.mockReturnValue(reply(400, { errors: ["title is required", "outcomes must be a non-empty list"] }));
    renderEditor();

    await user.click(screen.getByRole("button", { name: "Create project" }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("title is required");
    expect(alert).toHaveTextContent("outcomes must be a non-empty list");
    expect(screen.getAllByText(/Existing Project/)).toHaveLength(3);
  });

  it("shows a server error without leaking details", async () => {
    const user = userEvent.setup();
    fetchMock.mockReturnValue(reply(500, { error: "Something went wrong" }));
    renderEditor();

    await user.click(screen.getByRole("button", { name: "Create project" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Something went wrong");
  });

  it("shows a friendly error when the network request fails", async () => {
    const user = userEvent.setup();
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    renderEditor();

    await user.click(screen.getByRole("button", { name: "Create project" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Could not reach the server");
  });

  it("edits an existing project with the slug locked and sends PATCH", async () => {
    const user = userEvent.setup();
    const updated = { ...project, title: "Renamed Project" };
    fetchMock.mockReturnValue(reply(200, { project: updated }));
    renderEditor();

    await user.click(screen.getByRole("button", { name: "Edit Existing Project" }));
    expect(screen.getByLabelText("Slug")).toBeDisabled();
    expect(screen.getByLabelText("Slug")).toHaveValue("existing-project");

    await user.clear(screen.getByLabelText("Project title"));
    await user.type(screen.getByLabelText("Project title"), "Renamed Project");
    await user.click(screen.getByRole("button", { name: "Save project" }));

    expect(await screen.findByText("Project updated.")).toBeInTheDocument();
    expect(screen.getByText("Renamed Project")).toBeInTheDocument();
    expect(fetchMock.mock.calls[0][1].method).toBe("PATCH");
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).slug).toBe("existing-project");
  });

  it("requires a confirmation click before deleting, then removes the project", async () => {
    const user = userEvent.setup();
    fetchMock.mockReturnValue(reply(200, { ok: true }));
    renderEditor();

    await user.click(screen.getByRole("button", { name: "Delete Existing Project" }));
    expect(fetchMock).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Confirm delete Existing Project" }));

    expect(await screen.findByText("Project deleted.")).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole("button", { name: "Edit Existing Project" })).not.toBeInTheDocument());
    expect(fetchMock.mock.calls[0][1].method).toBe("DELETE");
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ slug: "existing-project" });
  });
});

describe("competency editing", () => {
  it("creates a competency and adds it to the list", async () => {
    const user = userEvent.setup();
    const created = { id: "skill-2", name: "New Skill", description: "Fresh." };
    fetchMock.mockReturnValue(reply(201, { skill: created }));
    renderEditor();

    await user.type(screen.getByLabelText("Competency name"), "New Skill");
    await user.type(screen.getByLabelText("Description"), "Fresh.");
    await user.click(screen.getByRole("button", { name: "Create competency" }));

    expect(await screen.findByText("Competency created.")).toBeInTheDocument();
    expect(screen.getByText("New Skill")).toBeInTheDocument();
    expect(fetchMock.mock.calls[0][0]).toBe("/api/skills");
  });

  it("updates a competency by id", async () => {
    const user = userEvent.setup();
    fetchMock.mockReturnValue(reply(200, { skill: { ...skill, name: "Renamed Skill" } }));
    renderEditor();

    await user.click(screen.getByRole("button", { name: "Edit Existing Skill" }));
    await user.clear(screen.getByLabelText("Competency name"));
    await user.type(screen.getByLabelText("Competency name"), "Renamed Skill");
    await user.click(screen.getByRole("button", { name: "Save competency" }));

    expect(await screen.findByText("Competency updated.")).toBeInTheDocument();
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ id: "skill-1", name: "Renamed Skill", description: "Already in the database.", tools: [] });
  });

  it("deletes a competency after confirmation", async () => {
    const user = userEvent.setup();
    fetchMock.mockReturnValue(reply(200, { ok: true }));
    renderEditor();

    await user.click(screen.getByRole("button", { name: "Delete Existing Skill" }));
    await user.click(screen.getByRole("button", { name: "Confirm delete Existing Skill" }));

    expect(await screen.findByText("Competency deleted.")).toBeInTheDocument();
    expect(screen.getByText("No competencies yet.")).toBeInTheDocument();
  });
});

describe("case study editing", () => {
  it("sends the story, links and parsed screenshots with a project", async () => {
    const user = userEvent.setup();
    fetchMock.mockReturnValue(reply(200, { project }));
    renderEditor();

    await user.click(screen.getByRole("button", { name: "Edit Existing Project" }));
    await user.type(screen.getByLabelText("The problem"), "Slow triage");
    await user.type(screen.getByLabelText("Live demo URL"), "https://demo.example.com");
    await user.type(screen.getByLabelText(/Screenshots/), "https://cdn.example.com/a.png | Dashboard view{enter}https://cdn.example.com/b.png | Graph | with pipe");
    await user.click(screen.getByRole("button", { name: "Save project" }));

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.problem).toBe("Slow triage");
    expect(body.liveUrl).toBe("https://demo.example.com");
    expect(body.images).toEqual([
      { url: "https://cdn.example.com/a.png", alt: "Dashboard view" },
      { url: "https://cdn.example.com/b.png", alt: "Graph | with pipe" },
    ]);
  });

  it("loads existing case study fields when editing", async () => {
    const user = userEvent.setup();
    render(<ContentEditor initialProjects={[{ ...project, approach: "Graph it", images: [{ url: "https://cdn.example.com/a.png", alt: "Shot" }] }]} initialSkills={[]} />);

    await user.click(screen.getByRole("button", { name: "Edit Existing Project" }));

    expect(screen.getByLabelText("The approach")).toHaveValue("Graph it");
    expect(screen.getByLabelText(/Screenshots/)).toHaveValue("https://cdn.example.com/a.png | Shot");
  });
});

describe("testimonial and publication editing", () => {
  const entry = { id: "h1", kind: "testimonial" as const, title: "Ada Lovelace", subtitle: "Manager, Analytical Co", body: "Karan shipped it early.", url: "https://linkedin.com/in/ada" };

  function renderWithEntry() {
    return render(<ContentEditor initialProjects={[]} initialSkills={[]} initialHighlights={[entry]} />);
  }

  it("creates a testimonial and adds it to the list", async () => {
    const user = userEvent.setup();
    fetchMock.mockReturnValue(reply(201, { highlight: { ...entry, id: "h2", title: "Grace Hopper" } }));
    render(<ContentEditor initialProjects={[]} initialSkills={[]} />);

    await user.type(screen.getByLabelText("Person's name"), "Grace Hopper");
    await user.type(screen.getByLabelText("What they said (the quote)"), "A joy to work with.");
    await user.click(screen.getByRole("button", { name: "Create entry" }));

    expect(await screen.findByText("Entry created.")).toBeInTheDocument();
    expect(screen.getByText("Grace Hopper")).toBeInTheDocument();
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/highlights");
    expect(JSON.parse(init.body)).toMatchObject({ kind: "testimonial", title: "Grace Hopper", body: "A joy to work with." });
  });

  it("relabels the fields for publications", async () => {
    const user = userEvent.setup();
    render(<ContentEditor initialProjects={[]} initialSkills={[]} />);

    await user.selectOptions(screen.getByLabelText("Type"), "publication");

    expect(screen.getByLabelText("Paper or article title")).toBeInTheDocument();
    expect(screen.getByLabelText("Venue and year")).toBeInTheDocument();
    expect(screen.getByLabelText("Short summary (optional)")).toBeInTheDocument();
  });

  it("edits by id and shows validation errors from the server", async () => {
    const user = userEvent.setup();
    fetchMock.mockReturnValue(reply(400, { errors: ["a testimonial needs the quote text"] }));
    renderWithEntry();

    await user.click(screen.getByRole("button", { name: "Edit Ada Lovelace" }));
    await user.clear(screen.getByLabelText("What they said (the quote)"));
    await user.click(screen.getByRole("button", { name: "Save entry" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("a testimonial needs the quote text");
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({ id: "h1", kind: "testimonial" });
    expect(fetchMock.mock.calls[0][1].method).toBe("PATCH");
  });

  it("deletes after confirmation", async () => {
    const user = userEvent.setup();
    fetchMock.mockReturnValue(reply(200, { ok: true }));
    renderWithEntry();

    await user.click(screen.getByRole("button", { name: "Delete Ada Lovelace" }));
    expect(fetchMock).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Confirm delete Ada Lovelace" }));

    expect(await screen.findByText("Entry deleted.")).toBeInTheDocument();
    expect(screen.getByText("No entries yet.")).toBeInTheDocument();
  });
});
