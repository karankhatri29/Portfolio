import { isValidPostDate, normalizeTag } from "@/lib/content/blog-utils";
import type { BlogPost } from "@/lib/content/blog";
import { HIGHLIGHT_KINDS } from "@/lib/content/highlight-kinds";
import type { HighlightKind } from "@/lib/content/highlight-kinds";
import type { Highlight, Project, ProjectImage, SkillRecord } from "@/lib/content/repository";

export type ValidationResult<T> = { valid: true; data: T } | { valid: false; errors: string[] };

const githubUrlPattern = /^https:\/\/github\.com\/[\w.-]+(?:\/[\w.-]+)?\/?$/;
const safeSlug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

const MAX_TEXT = 2000;
const MAX_IMAGES = 8;

function readOptionalText(value: unknown, field: string, errors: string[]): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "string" || value.length > MAX_TEXT) {
    errors.push(`${field} must be text of at most ${MAX_TEXT} characters`);
    return undefined;
  }
  return value.trim();
}

function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === "https:" && value.length <= 500;
  } catch {
    return false;
  }
}

function readOptionalUrl(value: unknown, field: string, errors: string[]): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "string" || (value.trim() !== "" && !isHttpsUrl(value.trim()))) {
    errors.push(`${field} must be an https link`);
    return undefined;
  }
  return value.trim();
}

function readImages(value: unknown, errors: string[]): ProjectImage[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value) || value.length > MAX_IMAGES) {
    errors.push(`images must be a list of at most ${MAX_IMAGES} items`);
    return undefined;
  }

  const images: ProjectImage[] = [];
  for (const item of value) {
    const record = typeof item === "object" && item !== null ? (item as Record<string, unknown>) : {};
    const url = typeof record.url === "string" ? record.url.trim() : "";
    const alt = typeof record.alt === "string" ? record.alt.trim() : "";
    if (!isHttpsUrl(url)) errors.push("every image needs an https link");
    else if (!alt || alt.length > 200) errors.push("every image needs a short description (alt text)");
    else images.push({ url, alt });
  }
  return images;
}

function readStringList(value: unknown, field: string, errors: string[]): string[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value) || !value.every(isNonEmptyString)) {
    errors.push(`${field} must be a list of non-empty strings`);
    return undefined;
  }
  return value.map((item) => item.trim());
}

export function validateProjectInput(payload: unknown): ValidationResult<Project> {
  const errors: string[] = [];
  const record = typeof payload === "object" && payload !== null ? (payload as Record<string, unknown>) : {};

  if (!isNonEmptyString(record.slug)) errors.push("slug is required");
  else if (!safeSlug.test(record.slug)) errors.push("slug must be lowercase letters, numbers, and hyphens only");

  if (!isNonEmptyString(record.title)) errors.push("title is required");
  if (!isNonEmptyString(record.year)) errors.push("year is required");
  if (!isNonEmptyString(record.summary)) errors.push("summary is required");
  if (!isNonEmptyString(record.role)) errors.push("role is required");

  if (!Array.isArray(record.outcomes) || record.outcomes.length === 0) {
    errors.push("outcomes must be a non-empty list");
  } else if (!record.outcomes.every(isNonEmptyString)) {
    errors.push("every outcome must be a non-empty string");
  }

  const stack = readStringList(record.stack, "stack", errors);

  let githubUrl: string | undefined;
  if (record.githubUrl !== undefined) {
    if (typeof record.githubUrl !== "string" || (record.githubUrl.trim() !== "" && !githubUrlPattern.test(record.githubUrl.trim()))) {
      errors.push("githubUrl must be a https://github.com link");
    } else {
      githubUrl = record.githubUrl.trim();
    }
  }

  const problem = readOptionalText(record.problem, "problem", errors);
  const approach = readOptionalText(record.approach, "approach", errors);
  const result = readOptionalText(record.result, "result", errors);
  const liveUrl = readOptionalUrl(record.liveUrl, "liveUrl", errors);
  const videoUrl = readOptionalUrl(record.videoUrl, "videoUrl", errors);
  const images = readImages(record.images, errors);

  if (errors.length > 0) return { valid: false, errors };

  return {
    valid: true,
    data: {
      slug: record.slug as string,
      title: record.title as string,
      year: record.year as string,
      summary: record.summary as string,
      role: record.role as string,
      outcomes: record.outcomes as string[],
      ...(stack ? { stack } : {}),
      ...(githubUrl !== undefined ? { githubUrl } : {}),
      ...(problem !== undefined ? { problem } : {}),
      ...(approach !== undefined ? { approach } : {}),
      ...(result !== undefined ? { result } : {}),
      ...(liveUrl !== undefined ? { liveUrl } : {}),
      ...(videoUrl !== undefined ? { videoUrl } : {}),
      ...(images !== undefined ? { images } : {}),
    },
  };
}

export function validateSkillInput(payload: unknown): ValidationResult<Omit<SkillRecord, "id">> {
  const errors: string[] = [];
  const record = typeof payload === "object" && payload !== null ? (payload as Record<string, unknown>) : {};

  if (!isNonEmptyString(record.name)) errors.push("name is required");
  if (!isNonEmptyString(record.description)) errors.push("description is required");
  const tools = readStringList(record.tools, "tools", errors);

  if (errors.length > 0) return { valid: false, errors };

  return { valid: true, data: { name: record.name as string, description: record.description as string, ...(tools ? { tools } : {}) } };
}

export function validateHighlightInput(payload: unknown): ValidationResult<Omit<Highlight, "id">> {
  const errors: string[] = [];
  const record = typeof payload === "object" && payload !== null ? (payload as Record<string, unknown>) : {};

  const kind = record.kind as HighlightKind;
  if (!(HIGHLIGHT_KINDS as readonly string[]).includes(kind)) errors.push("kind must be testimonial or publication");

  const title = typeof record.title === "string" ? record.title.trim() : "";
  if (!title) errors.push("title is required");
  else if (title.length > 200) errors.push("title must be 200 characters or fewer");

  const subtitle = typeof record.subtitle === "string" ? record.subtitle.trim() : "";
  if (subtitle.length > 200) errors.push("subtitle must be 200 characters or fewer");

  const body = typeof record.body === "string" ? record.body.trim() : "";
  if (kind === "testimonial" && !body) errors.push("a testimonial needs the quote text");
  if (body.length > MAX_TEXT) errors.push(`body must be at most ${MAX_TEXT} characters`);

  const url = readOptionalUrl(record.url, "url", errors);

  if (errors.length > 0) return { valid: false, errors };
  return { valid: true, data: { kind, title, subtitle, body, ...(url ? { url } : {}) } };
}

const MAX_POST_CONTENT = 100_000;
const MAX_TAGS = 8;

export function validatePostInput(payload: unknown): ValidationResult<BlogPost> {
  const errors: string[] = [];
  const record = typeof payload === "object" && payload !== null ? (payload as Record<string, unknown>) : {};

  const slug = typeof record.slug === "string" ? record.slug.trim() : "";
  if (!slug) errors.push("slug is required");
  else if (!safeSlug.test(slug)) errors.push("slug must be lowercase letters, numbers, and hyphens only");

  const title = typeof record.title === "string" ? record.title.trim() : "";
  if (!title) errors.push("title is required");
  else if (title.length > 200) errors.push("title must be 200 characters or fewer");

  const date = typeof record.date === "string" ? record.date.trim() : "";
  if (!isValidPostDate(date)) errors.push("date must be a real date written as YYYY-MM-DD");

  const summary = typeof record.summary === "string" ? record.summary.trim() : "";
  if (!summary) errors.push("summary is required");
  else if (summary.length > 300) errors.push("summary must be 300 characters or fewer");

  const content = typeof record.content === "string" ? record.content.trim() : "";
  if (!content) errors.push("content is required");
  else if (content.length > MAX_POST_CONTENT) errors.push(`content must be at most ${MAX_POST_CONTENT} characters`);

  let tags: string[] = [];
  if (record.tags !== undefined) {
    if (!Array.isArray(record.tags) || !record.tags.every((tag) => typeof tag === "string")) {
      errors.push("tags must be a list of text");
    } else {
      tags = [...new Set((record.tags as string[]).map(normalizeTag).filter(Boolean))];
      if (tags.length > MAX_TAGS) errors.push(`use at most ${MAX_TAGS} tags`);
    }
  }

  const status = record.status;
  if (status !== "draft" && status !== "published") errors.push("status must be draft or published");

  if (errors.length > 0) return { valid: false, errors };
  return { valid: true, data: { slug, title, date, summary, content, tags, status: status as BlogPost["status"] } };
}
