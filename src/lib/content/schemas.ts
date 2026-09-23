import type { Project, SkillRecord } from "@/lib/content/repository";

export type ValidationResult<T> = { valid: true; data: T } | { valid: false; errors: string[] };

const safeSlug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
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
    },
  };
}

export function validateSkillInput(payload: unknown): ValidationResult<Omit<SkillRecord, "id">> {
  const errors: string[] = [];
  const record = typeof payload === "object" && payload !== null ? (payload as Record<string, unknown>) : {};

  if (!isNonEmptyString(record.name)) errors.push("name is required");
  if (!isNonEmptyString(record.description)) errors.push("description is required");

  if (errors.length > 0) return { valid: false, errors };

  return { valid: true, data: { name: record.name as string, description: record.description as string } };
}
