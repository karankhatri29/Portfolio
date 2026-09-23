import { extractHeadings, formatPostDate, isValidPostDate, normalizeTag, readingMinutes, slugifyHeading } from "@/lib/content/blog-utils";

describe("readingMinutes", () => {
  it("rounds up, never returns less than one minute, and ignores code blocks", () => {
    expect(readingMinutes("short")).toBe(1);
    expect(readingMinutes(Array(221).fill("word").join(" "))).toBe(2);
    expect(readingMinutes(Array(440).fill("word").join(" "))).toBe(2);
    expect(readingMinutes("intro\n```\n" + Array(2000).fill("code").join(" ") + "\n```\nend")).toBe(1);
    expect(readingMinutes("")).toBe(1);
  });
});

describe("slugifyHeading", () => {
  it("makes stable anchor ids", () => {
    expect(slugifyHeading("A useful constraint")).toBe("a-useful-constraint");
    expect(slugifyHeading("  What's next? (Part 2)  ")).toBe("whats-next-part-2");
    expect(slugifyHeading("Multi   space -- dash")).toBe("multi-space-dash");
  });
});

describe("extractHeadings", () => {
  const markdown = [
    "# Title is skipped",
    "## First section",
    "text",
    "### A `code` and **bold** [link](https://x.y) sub",
    "```bash",
    "## not a heading in code",
    "```",
    "~~~",
    "## also not a heading",
    "~~~",
    "## Second section ##",
    "#### too deep",
  ].join("\n");

  it("returns h2 and h3 headings in order with cleaned text and ids", () => {
    expect(extractHeadings(markdown)).toEqual([
      { id: "first-section", text: "First section", level: 2 },
      { id: "a-code-and-bold-link-sub", text: "A code and bold link sub", level: 3 },
      { id: "second-section", text: "Second section", level: 2 },
    ]);
  });

  it("returns an empty list for text without headings", () => {
    expect(extractHeadings("just a paragraph")).toEqual([]);
  });
});

describe("normalizeTag", () => {
  it("lowercases, hyphenates and trims", () => {
    expect(normalizeTag("  Machine Learning! ")).toBe("machine-learning");
    expect(normalizeTag("C++")).toBe("c");
    expect(normalizeTag("x".repeat(50))).toHaveLength(30);
  });
});

describe("dates", () => {
  it("validates real calendar dates only", () => {
    expect(isValidPostDate("2026-09-01")).toBe(true);
    expect(isValidPostDate("2026-02-30")).toBe(false);
    expect(isValidPostDate("Sep 1 2026")).toBe(false);
    expect(isValidPostDate("")).toBe(false);
  });

  it("formats valid dates and leaves anything else untouched", () => {
    expect(formatPostDate("2026-09-01")).toBe("Sep 1, 2026");
    expect(formatPostDate("someday")).toBe("someday");
  });
});
