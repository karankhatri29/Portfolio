import { formatMonth, monthOf, parseMonth } from "@/lib/timeline/months";

export type DegreeProgress = {
  /** 0 to 1, how far through the programme "now" is. */
  progress: number;
  status: "upcoming" | "in-progress" | "complete";
  label: string;
  startYear: number;
  endYear: number;
  years: number;
  yearOfStudy: number | null;
};

/** Where a degree stands on a given date. Returns null for missing, invalid or backwards dates. */
export function degreeProgress(start: string, end: string, now: Date): DegreeProgress | null {
  const startIndex = parseMonth(start);
  const endIndex = parseMonth(end);
  if (startIndex === undefined || endIndex === undefined || endIndex <= startIndex) return null;

  const totalMonths = endIndex - startIndex;
  const years = Math.ceil(totalMonths / 12);
  const startYear = Math.floor(startIndex / 12);
  const endYear = Math.floor(endIndex / 12);
  // Whole months since the start month, plus how far through the current month we are.
  const elapsed = monthOf(now) - startIndex + (now.getDate() - 1) / 31;
  const progress = Math.min(1, Math.max(0, elapsed / totalMonths));
  const base = { progress, startYear, endYear, years };

  if (elapsed < 0) return { ...base, status: "upcoming", label: `Starts ${formatMonth(startIndex)}`, yearOfStudy: null };
  if (elapsed >= totalMonths) return { ...base, status: "complete", label: `Graduated ${endYear}`, yearOfStudy: years };

  const yearOfStudy = Math.min(years, Math.floor(elapsed / 12) + 1);
  const label = yearOfStudy === years ? `Final year (${years} of ${years})` : `Year ${yearOfStudy} of ${years}`;
  return { ...base, status: "in-progress", label, yearOfStudy };
}
