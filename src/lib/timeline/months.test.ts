import type { TimelineItem } from "@/data/portfolio";
import { activeAt, buildGantt, formatMonth, monthOf, neighbours, parseMonth } from "@/lib/timeline/months";

const item = (organization: string, start?: string, end?: string | null): TimelineItem => ({ year: `${start}-${end}`, title: "Role", organization, summary: "s", start, end });

const items = [
  item("Latest", "2026-05", null),
  item("Recommender", "2025-11", "2026-02"),
  item("Marketplace", "2025-04", "2025-08"),
  item("Compression", "2025-03", "2025-05"),
];
const now = new Date(2026, 8, 15); // 15 September 2026

describe("parseMonth and formatMonth", () => {
  it("parses YYYY-MM and rejects anything else", () => {
    expect(parseMonth("2025-03")).toBe(2025 * 12 + 2);
    for (const bad of ["2025-13", "2025-00", "2025-3", "March 2025", "", null, undefined]) expect(parseMonth(bad)).toBeUndefined();
  });

  it("round-trips through formatMonth", () => {
    expect(formatMonth(parseMonth("2025-04")!)).toBe("Apr 2025");
    expect(formatMonth(parseMonth("2026-01")!, true)).toBe("January 2026");
    expect(formatMonth(monthOf(now))).toBe("Sep 2026");
  });
});

describe("buildGantt", () => {
  const gantt = buildGantt(items, now)!;

  it("spans from the earliest start to the current month for ongoing work", () => {
    expect(formatMonth(gantt.first)).toBe("Mar 2025");
    expect(formatMonth(gantt.last)).toBe("Sep 2026");
    expect(gantt.total).toBe(19);
    expect(formatMonth(gantt.now)).toBe("Sep 2026");
  });

  it("counts inclusive months and flags ongoing entries", () => {
    const byName = Object.fromEntries(gantt.entries.map((entry) => [entry.item.organization, entry]));
    expect(byName.Compression.months).toBe(3);
    expect(byName.Marketplace.months).toBe(5);
    expect(byName.Recommender.months).toBe(4);
    expect(byName.Latest.months).toBe(5);
    expect(byName.Latest.ongoing).toBe(true);
    expect(byName.Marketplace.ongoing).toBe(false);
  });

  it("keeps the supplied order", () => {
    expect(gantt.entries.map((entry) => entry.item.organization)).toEqual(["Latest", "Recommender", "Marketplace", "Compression"]);
  });

  it("returns null so the plain list is used when any date is missing or invalid", () => {
    expect(buildGantt([...items, item("Undated")], now)).toBeNull();
    expect(buildGantt([item("Bad end", "2025-01", "soon")], now)).toBeNull();
    expect(buildGantt([], now)).toBeNull();
  });

  it("never lets an entry end before it starts, even if it starts in the future", () => {
    const future = buildGantt([item("Future", "2027-01", null)], now)!;
    expect(future.entries[0].months).toBe(1);
    expect(future.total).toBe(1);
  });
});

describe("activeAt and neighbours", () => {
  const gantt = buildGantt(items, now)!;
  const names = (month: string) => activeAt(gantt.entries, parseMonth(month)!).map((entry) => entry.item.organization).sort();

  it("finds every entry running in a month, including overlaps", () => {
    expect(names("2025-04")).toEqual(["Compression", "Marketplace"]);
    expect(names("2025-06")).toEqual(["Marketplace"]);
    expect(names("2026-09")).toEqual(["Latest"]);
  });

  it("returns nothing in a gap and reports the entries on either side", () => {
    expect(names("2025-10")).toEqual([]);
    const { before, after } = neighbours(gantt.entries, parseMonth("2025-10")!);
    expect(before.item.organization).toBe("Marketplace");
    expect(after.item.organization).toBe("Recommender");
  });
});
