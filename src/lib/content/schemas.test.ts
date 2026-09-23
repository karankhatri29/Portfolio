import { validatePostInput, validateProjectInput, validateSkillInput } from "@/lib/content/schemas";

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

describe("case study fields", () => {
  const base = { slug: "alpha", title: "Alpha", year: "2026", summary: "s", role: "r", outcomes: ["o"] };

  it("accepts and trims the optional story, links and images", () => {
    const result = validateProjectInput({
      ...base,
      problem: "  Emails pile up ",
      approach: "Graph the obligations",
      result: "Half the triage time",
      liveUrl: "https://demo.example.com/app",
      videoUrl: "https://www.youtube.com/watch?v=abc",
      images: [{ url: "https://cdn.example.com/a.png", alt: " Dashboard screenshot " }],
    });

    expect(result).toMatchObject({
      valid: true,
      data: { problem: "Emails pile up", liveUrl: "https://demo.example.com/app", images: [{ url: "https://cdn.example.com/a.png", alt: "Dashboard screenshot" }] },
    });
  });

  it("stays valid without any of them", () => {
    expect(validateProjectInput(base).valid).toBe(true);
  });

  it.each([
    ["a non-https live link", { liveUrl: "http://demo.example.com" }, "liveUrl must be an https link"],
    ["a javascript link", { videoUrl: "javascript:alert(1)" }, "videoUrl must be an https link"],
    ["an oversized story", { problem: "x".repeat(2001) }, "problem must be text of at most 2000 characters"],
    ["an image without alt text", { images: [{ url: "https://cdn.example.com/a.png", alt: "" }] }, "every image needs a short description (alt text)"],
    ["an image with a bad link", { images: [{ url: "/local.png", alt: "x" }] }, "every image needs an https link"],
    ["too many images", { images: Array.from({ length: 9 }, () => ({ url: "https://cdn.example.com/a.png", alt: "x" })) }, "images must be a list of at most 8 items"],
  ])("rejects %s", (_label, extra, message) => {
    const result = validateProjectInput({ ...base, ...extra });

    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.errors).toContain(message);
  });

  it("allows clearing a link with an empty string", () => {
    expect(validateProjectInput({ ...base, liveUrl: "" })).toMatchObject({ valid: true, data: { liveUrl: "" } });
  });
});

describe("validatePostInput", () => {
  const post = { slug: "hello-world", title: "Hello World", date: "2026-09-01", summary: "A first post.", content: "## Hi\n\nText.", tags: ["AI", "ai", " Machine Learning "], status: "draft" };

  it("accepts a complete post and normalises tags (lowercased, de-duplicated)", () => {
    expect(validatePostInput(post)).toEqual({ valid: true, data: { ...post, tags: ["ai", "machine-learning"] } });
  });

  it("defaults to no tags", () => {
    const { tags: _tags, ...rest } = post;

    expect(validatePostInput(rest)).toMatchObject({ valid: true, data: { tags: [] } });
  });

  it.each([
    ["a missing slug", { slug: "" }, "slug is required"],
    ["an unsafe slug", { slug: "Hello World!" }, "slug must be lowercase letters, numbers, and hyphens only"],
    ["a missing title", { title: " " }, "title is required"],
    ["an impossible date", { date: "2026-02-30" }, "date must be a real date written as YYYY-MM-DD"],
    ["a wordy date", { date: "September 1" }, "date must be a real date written as YYYY-MM-DD"],
    ["a long summary", { summary: "x".repeat(301) }, "summary must be 300 characters or fewer"],
    ["empty content", { content: "" }, "content is required"],
    ["huge content", { content: "x".repeat(100_001) }, "content must be at most 100000 characters"],
    ["an unknown status", { status: "archived" }, "status must be draft or published"],
    ["too many tags", { tags: Array.from({ length: 9 }, (_, i) => `tag${i}`) }, "use at most 8 tags"],
    ["non-text tags", { tags: [1, 2] }, "tags must be a list of text"],
  ])("rejects %s", (_label, extra, message) => {
    const result = validatePostInput({ ...post, ...extra });

    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.errors).toContain(message);
  });
});
