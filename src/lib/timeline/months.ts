import type { TimelineItem } from "@/data/portfolio";

const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTH_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** A month as a single integer (year * 12 + zero-based month) so ranges are plain arithmetic. */
export type MonthIndex = number;

export function parseMonth(value: string | null | undefined): MonthIndex | undefined {
  const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(value ?? "");
  return match ? Number(match[1]) * 12 + (Number(match[2]) - 1) : undefined;
}

export const monthOf = (date: Date): MonthIndex => date.getFullYear() * 12 + date.getMonth();

export const monthName = (index: MonthIndex) => MONTH_SHORT[((index % 12) + 12) % 12];
export const isJanuary = (index: MonthIndex) => ((index % 12) + 12) % 12 === 0;

export function formatMonth(index: MonthIndex, long = false): string {
  const names = long ? MONTH_LONG : MONTH_SHORT;
  return `${names[((index % 12) + 12) % 12]} ${Math.floor(index / 12)}`;
}

export type GanttEntry = {
  key: string;
  item: TimelineItem;
  start: MonthIndex;
  /** Inclusive last month; the current month for entries that are still going. */
  end: MonthIndex;
  ongoing: boolean;
  /** Number of calendar months covered, counting both ends. */
  months: number;
};

export type Gantt = { entries: GanttEntry[]; first: MonthIndex; last: MonthIndex; total: number; now: MonthIndex };

/** Returns null unless every item carries a valid start month, so callers can fall back to the plain list. */
export function buildGantt(items: TimelineItem[], now: Date): Gantt | null {
  const nowIndex = monthOf(now);
  const entries: GanttEntry[] = [];

  for (const item of items) {
    const start = parseMonth(item.start);
    if (start === undefined) return null;
    const parsedEnd = item.end ? parseMonth(item.end) : undefined;
    if (item.end && parsedEnd === undefined) return null;
    const ongoing = !item.end;
    const end = Math.max(start, parsedEnd ?? nowIndex);
    entries.push({ key: `${item.year}-${item.organization}`, item, start, end, ongoing, months: end - start + 1 });
  }
  if (!entries.length) return null;

  const first = Math.min(...entries.map((entry) => entry.start));
  const last = Math.max(...entries.map((entry) => entry.end));
  return { entries, first, last, total: last - first + 1, now: Math.min(Math.max(nowIndex, first), last) };
}

export const activeAt = (entries: GanttEntry[], month: MonthIndex) => entries.filter((entry) => entry.start <= month && month <= entry.end);

/** For a month with nothing running: the entry that finished most recently and the one that starts next. */
export function neighbours(entries: GanttEntry[], month: MonthIndex) {
  const before = entries.filter((entry) => entry.end < month).sort((a, b) => b.end - a.end)[0];
  const after = entries.filter((entry) => entry.start > month).sort((a, b) => a.start - b.start)[0];
  return { before, after };
}
