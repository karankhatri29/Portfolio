/**
 * @jest-environment node
 */
import { auth } from "@/auth";
import * as repository from "@/lib/content/repository";

import { DELETE, GET, PATCH, POST } from "./route";

jest.mock("@/auth", () => ({ auth: jest.fn() }));
jest.mock("@/lib/content/repository", () => ({
  listSkills: jest.fn(),
  createSkill: jest.fn(),
  updateSkill: jest.fn(),
  deleteSkill: jest.fn(),
}));

const mockAuth = auth as unknown as jest.Mock;
const repo = jest.mocked(repository);

const adminSession = { user: { email: "owner@example.com" }, role: "Admin" };
const visitorSession = { user: { email: "visitor@example.com" }, role: "Visitor" };

const skill = { id: "skill-1", name: "Testing", description: "Writes tests." };

function jsonRequest(method: string, body?: unknown) {
  return new Request("http://localhost/api/skills", {
    method,
    headers: { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

describe("/api/skills authorization", () => {
  it("rejects unauthenticated requests with 401 on every method", async () => {
    mockAuth.mockResolvedValue(null);

    const responses = await Promise.all([GET(), POST(jsonRequest("POST", skill)), PATCH(jsonRequest("PATCH", skill)), DELETE(jsonRequest("DELETE", { id: "skill-1" }))]);

    expect(responses.map((response) => response.status)).toEqual([401, 401, 401, 401]);
    expect(repo.createSkill).not.toHaveBeenCalled();
    expect(repo.updateSkill).not.toHaveBeenCalled();
    expect(repo.deleteSkill).not.toHaveBeenCalled();
  });

  it("rejects Visitor sessions with 403 and never touches the repository", async () => {
    mockAuth.mockResolvedValue(visitorSession);

    const responses = await Promise.all([GET(), POST(jsonRequest("POST", skill)), PATCH(jsonRequest("PATCH", skill)), DELETE(jsonRequest("DELETE", { id: "skill-1" }))]);

    expect(responses.map((response) => response.status)).toEqual([403, 403, 403, 403]);
    expect(repo.listSkills).not.toHaveBeenCalled();
    expect(repo.createSkill).not.toHaveBeenCalled();
    expect(repo.updateSkill).not.toHaveBeenCalled();
    expect(repo.deleteSkill).not.toHaveBeenCalled();
  });
});

describe("/api/skills as Admin", () => {
  beforeEach(() => {
    mockAuth.mockResolvedValue(adminSession);
  });

  it("lists competencies", async () => {
    repo.listSkills.mockResolvedValue([skill]);

    const response = await GET();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ skills: [skill] });
  });

  it("creates a competency and returns 201", async () => {
    repo.createSkill.mockResolvedValue(skill);

    const response = await POST(jsonRequest("POST", { name: "Testing", description: "Writes tests." }));

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ skill });
    expect(repo.createSkill).toHaveBeenCalledWith({ name: "Testing", description: "Writes tests." });
  });

  it("returns structured validation errors and does not write on invalid input", async () => {
    const response = await POST(jsonRequest("POST", { name: "", description: "" }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.errors).toEqual(expect.arrayContaining(["name is required", "description is required"]));
    expect(repo.createSkill).not.toHaveBeenCalled();
  });

  it("updates an existing competency by id", async () => {
    repo.updateSkill.mockResolvedValue({ ...skill, name: "Renamed" });

    const response = await PATCH(jsonRequest("PATCH", { id: "skill-1", name: "Renamed", description: "Writes tests." }));

    expect(response.status).toBe(200);
    expect(repo.updateSkill).toHaveBeenCalledWith("skill-1", { name: "Renamed", description: "Writes tests." });
  });

  it("requires an id to update and returns 404 for an unknown id", async () => {
    expect((await PATCH(jsonRequest("PATCH", { name: "x", description: "y" }))).status).toBe(400);

    repo.updateSkill.mockResolvedValue(undefined);
    expect((await PATCH(jsonRequest("PATCH", { id: "missing", name: "x", description: "y" }))).status).toBe(404);
  });

  it("deletes a competency by id and handles missing input or records", async () => {
    repo.deleteSkill.mockResolvedValue(true);
    expect((await DELETE(jsonRequest("DELETE", { id: "skill-1" }))).status).toBe(200);
    expect(repo.deleteSkill).toHaveBeenCalledWith("skill-1");

    expect((await DELETE(jsonRequest("DELETE", {}))).status).toBe(400);

    repo.deleteSkill.mockResolvedValue(false);
    expect((await DELETE(jsonRequest("DELETE", { id: "missing" }))).status).toBe(404);
  });

  it("hides internal error details when the repository throws", async () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
    repo.listSkills.mockRejectedValue(new Error("connection string postgres://secret leaked"));

    const response = await GET();
    const text = await response.text();

    expect(response.status).toBe(500);
    expect(text).not.toContain("secret");
    consoleError.mockRestore();
  });
});
