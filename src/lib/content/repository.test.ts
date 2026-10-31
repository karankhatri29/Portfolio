/**
 * @jest-environment node
 */
import { neon } from "@neondatabase/serverless";
import { revalidateTag } from "next/cache";

import { createHighlight, createProject, createSkill, deleteHighlight, deleteProject, deleteSkill, listHighlights, listProjects, listSkills, updateHighlight, updateProject, updateSkill } from "@/lib/content/repository";

jest.mock("@neondatabase/serverless", () => ({ neon: jest.fn() }));

const sqlMock = jest.fn();
const mockNeon = jest.mocked(neon);
const mockRevalidate = jest.mocked(revalidateTag);
const env = process.env as Record<string, string | undefined>;
const original = env.DATABASE_URL;

const projectRow = { slug: "p", title: "P", year: "2026", summary: "S", role: "R", outcomes: ["o"], stack: null, github_url: null, problem: null, approach: null, result: null, live_url: null, video_url: null, images: null };
const project = { slug: "p", title: "P", year: "2026", summary: "S", role: "R", outcomes: ["o"] };
const highlight = { kind: "testimonial" as const, title: "T", subtitle: "S", body: "B" };

beforeEach(() => {
  sqlMock.mockReset();
  mockNeon.mockReturnValue(sqlMock as unknown as ReturnType<typeof neon>);
  env.DATABASE_URL = "postgres://test";
});

afterAll(() => {
  env.DATABASE_URL = original;
});

describe("public list reads", () => {
  it("retry once when Neon cannot be reached", async () => {
    sqlMock.mockRejectedValueOnce(new Error("Error connecting to database: TypeError: fetch failed")).mockResolvedValue([projectRow]);

    expect((await listProjects()).map((p) => p.slug)).toEqual(["p"]);
    expect(sqlMock).toHaveBeenCalledTimes(2);
  });

  it("map rows for skills and highlights", async () => {
    sqlMock.mockResolvedValueOnce([{ id: "1", name: "Python", description: "d", tools: null }]);
    expect(await listSkills()).toEqual([{ id: "1", name: "Python", description: "d", tools: [] }]);

    sqlMock.mockResolvedValueOnce([{ id: "2", kind: "testimonial", title: "T", subtitle: "S", body: "B", url: null }]);
    expect((await listHighlights("testimonial"))[0]).toMatchObject({ id: "2", url: undefined });
  });
});

describe("cache invalidation", () => {
  it("expires the projects tag immediately after create, update and delete", async () => {
    sqlMock.mockResolvedValue([projectRow]);
    await createProject(project);
    await updateProject("p", { title: "New" });
    sqlMock.mockResolvedValue([{ slug: "p" }]);
    await deleteProject("p");

    expect(mockRevalidate.mock.calls).toEqual([["projects", { expire: 0 }], ["projects", { expire: 0 }], ["projects", { expire: 0 }]]);
  });

  it("expires the skills tag after create, update and delete", async () => {
    sqlMock.mockResolvedValue([{ id: "1", name: "N", description: "d", tools: [] }]);
    await createSkill({ name: "N", description: "d" });
    await updateSkill("1", { name: "M" });
    await deleteSkill("1");

    expect(mockRevalidate.mock.calls.map(([tag]) => tag)).toEqual(["skills", "skills", "skills"]);
  });

  it("expires the highlights tag after create, update and delete", async () => {
    sqlMock.mockResolvedValue([{ id: "2", kind: "testimonial", title: "T", subtitle: "S", body: "B", url: null }]);
    await createHighlight(highlight);
    await updateHighlight("2", { title: "U" });
    await deleteHighlight("2");

    expect(mockRevalidate.mock.calls.map(([tag]) => tag)).toEqual(["highlights", "highlights", "highlights"]);
  });

  it("does not invalidate when the update finds nothing to change", async () => {
    sqlMock.mockResolvedValue([]);

    expect(await updateProject("missing", { title: "x" })).toBeUndefined();
    expect(mockRevalidate).not.toHaveBeenCalled();
  });
});
