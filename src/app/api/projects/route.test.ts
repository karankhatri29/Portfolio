/**
 * @jest-environment node
 */
import { auth } from "@/auth";
import * as repository from "@/lib/content/repository";

import { DELETE, GET, PATCH, POST } from "./route";

jest.mock("@/auth", () => ({ auth: jest.fn() }));
jest.mock("@/lib/content/repository", () => ({
  listProjects: jest.fn(),
  getProject: jest.fn(),
  createProject: jest.fn(),
  updateProject: jest.fn(),
  deleteProject: jest.fn(),
}));

const mockAuth = auth as unknown as jest.Mock;
const repo = jest.mocked(repository);

const adminSession = { user: { email: "owner@example.com" }, role: "Admin" };
const visitorSession = { user: { email: "visitor@example.com" }, role: "Visitor" };

const validProject = {
  slug: "test-project",
  title: "Test Project",
  year: "2026",
  summary: "A project used in tests.",
  role: "Engineer",
  outcomes: ["Shipped a thing"],
};

function jsonRequest(method: string, body?: unknown) {
  return new Request("http://localhost/api/projects", {
    method,
    headers: { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

describe("/api/projects authorization", () => {
  it("rejects unauthenticated requests with 401 on every method", async () => {
    mockAuth.mockResolvedValue(null);

    const responses = await Promise.all([GET(), POST(jsonRequest("POST", validProject)), PATCH(jsonRequest("PATCH", validProject)), DELETE(jsonRequest("DELETE", { slug: "x" }))]);

    expect(responses.map((response) => response.status)).toEqual([401, 401, 401, 401]);
    expect(repo.createProject).not.toHaveBeenCalled();
    expect(repo.updateProject).not.toHaveBeenCalled();
    expect(repo.deleteProject).not.toHaveBeenCalled();
  });

  it("rejects Visitor sessions with 403 and never touches the repository", async () => {
    mockAuth.mockResolvedValue(visitorSession);

    const responses = await Promise.all([GET(), POST(jsonRequest("POST", validProject)), PATCH(jsonRequest("PATCH", validProject)), DELETE(jsonRequest("DELETE", { slug: "x" }))]);

    expect(responses.map((response) => response.status)).toEqual([403, 403, 403, 403]);
    expect(repo.listProjects).not.toHaveBeenCalled();
    expect(repo.createProject).not.toHaveBeenCalled();
    expect(repo.updateProject).not.toHaveBeenCalled();
    expect(repo.deleteProject).not.toHaveBeenCalled();
  });
});

describe("/api/projects as Admin", () => {
  beforeEach(() => {
    mockAuth.mockResolvedValue(adminSession);
  });

  it("lists projects", async () => {
    repo.listProjects.mockResolvedValue([validProject]);

    const response = await GET();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ projects: [validProject] });
  });

  it("creates a project and returns 201", async () => {
    repo.getProject.mockResolvedValue(undefined);
    repo.createProject.mockResolvedValue(validProject);

    const response = await POST(jsonRequest("POST", validProject));

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ project: validProject });
    expect(repo.createProject).toHaveBeenCalledWith(validProject);
  });

  it("returns structured validation errors and does not write on invalid input", async () => {
    const response = await POST(jsonRequest("POST", { ...validProject, title: "", outcomes: [] }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.errors).toEqual(expect.arrayContaining(["title is required", "outcomes must be a non-empty list"]));
    expect(repo.createProject).not.toHaveBeenCalled();
  });

  it("treats a non-JSON body as a validation error", async () => {
    const request = new Request("http://localhost/api/projects", { method: "POST", body: "not json" });

    const response = await POST(request);

    expect(response.status).toBe(400);
    expect(repo.createProject).not.toHaveBeenCalled();
  });

  it("returns 409 when the slug already exists", async () => {
    repo.getProject.mockResolvedValue(validProject);

    const response = await POST(jsonRequest("POST", validProject));

    expect(response.status).toBe(409);
    expect(repo.createProject).not.toHaveBeenCalled();
  });

  it("updates an existing project", async () => {
    const updated = { ...validProject, title: "Renamed" };
    repo.updateProject.mockResolvedValue(updated);

    const response = await PATCH(jsonRequest("PATCH", updated));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ project: updated });
  });

  it("returns 404 when updating a missing project", async () => {
    repo.updateProject.mockResolvedValue(undefined);

    const response = await PATCH(jsonRequest("PATCH", validProject));

    expect(response.status).toBe(404);
  });

  it("deletes a project by slug", async () => {
    repo.deleteProject.mockResolvedValue(true);

    const response = await DELETE(jsonRequest("DELETE", { slug: "test-project" }));

    expect(response.status).toBe(200);
    expect(repo.deleteProject).toHaveBeenCalledWith("test-project");
  });

  it("returns 400 when delete has no slug and 404 when the slug is unknown", async () => {
    expect((await DELETE(jsonRequest("DELETE", {}))).status).toBe(400);

    repo.deleteProject.mockResolvedValue(false);
    expect((await DELETE(jsonRequest("DELETE", { slug: "missing" }))).status).toBe(404);
  });

  it("hides internal error details when the repository throws", async () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
    repo.listProjects.mockRejectedValue(new Error("connection string postgres://secret leaked"));

    const response = await GET();
    const text = await response.text();

    expect(response.status).toBe(500);
    expect(text).not.toContain("secret");
    expect(JSON.parse(text)).toEqual({ error: "Something went wrong" });
    consoleError.mockRestore();
  });
});
