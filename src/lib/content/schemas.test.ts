import { validateProjectInput, validateSkillInput } from "@/lib/content/schemas";

describe("validateProjectInput", () => {
  const validProject = {
    slug: "test-project",
    title: "Test Project",
    year: "2026",
    summary: "A project used in tests.",
    role: "Engineer",
    outcomes: ["Shipped a thing"],
  };

  it("accepts a fully populated payload", () => {
    const result = validateProjectInput(validProject);
    expect(result).toEqual({ valid: true, data: validProject });
  });

  it("rejects a missing required field", () => {
    const { title: _title, ...rest } = validProject;
    const result = validateProjectInput(rest);
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.errors).toContain("title is required");
  });

  it("rejects a slug with invalid characters", () => {
    const result = validateProjectInput({ ...validProject, slug: "Not A Slug!" });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.errors).toContain("slug must be lowercase letters, numbers, and hyphens only");
  });

  it("rejects an empty outcomes list", () => {
    const result = validateProjectInput({ ...validProject, outcomes: [] });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.errors).toContain("outcomes must be a non-empty list");
  });

  it("accepts a github repository link and a blank one, and rejects other hosts", () => {
    expect(validateProjectInput({ ...validProject, githubUrl: " https://github.com/karankhatri29/portfolio " })).toEqual({ valid: true, data: { ...validProject, githubUrl: "https://github.com/karankhatri29/portfolio" } });
    expect(validateProjectInput({ ...validProject, githubUrl: "" })).toEqual({ valid: true, data: { ...validProject, githubUrl: "" } });
    for (const bad of ["https://gitlab.com/a/b", "http://github.com/a/b", "javascript:alert(1)", 42]) {
      expect(validateProjectInput({ ...validProject, githubUrl: bad }).valid).toBe(false);
    }
  });

  it("rejects a non-object payload", () => {
    const result = validateProjectInput(null);
    expect(result.valid).toBe(false);
  });
});

describe("validateSkillInput", () => {
  it("accepts a valid payload", () => {
    const result = validateSkillInput({ name: "Testing", description: "Writes tests." });
    expect(result).toEqual({ valid: true, data: { name: "Testing", description: "Writes tests." } });
  });

  it("rejects a blank description", () => {
    const result = validateSkillInput({ name: "Testing", description: "   " });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.errors).toContain("description is required");
  });
});
