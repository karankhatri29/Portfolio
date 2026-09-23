import type { Project, SkillRecord } from "@/lib/content/repository";

export type ValidationResult<T> = { valid: true; data: T } | { valid: false; errors: string[] };

const githubUrlPattern = /^https:\/\/github\.com\/[\w.-]+(?:\/[\w.-]+)?\/?$/;
const safeSlug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
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
