import { countryName, formatDuration, percentOf, plural, timeAgo } from "@/lib/analytics/format";

describe("countryName", () => {
  it("expands region codes and falls back to the input", () => {
    expect(countryName("IN")).toBe("India");
    expect(countryName("us")).toBe("United States");
    expect(countryName("not a code")).toBe("not a code");
  });
});

describe("formatDuration", () => {
  it.each([[45, "45s"], [60, "1m"], [95, "1m 35s"], [1800, "30m"]])("formats %p seconds", (seconds, expected) => {
    expect(formatDuration(seconds)).toBe(expected);
  });
});

describe("timeAgo", () => {
  const now = new Date("2026-09-23T12:00:00Z");

  it("uses the largest sensible unit", () => {
    expect(timeAgo("2026-09-23T11:59:40Z", now)).toBe("just now");
    expect(timeAgo("2026-09-23T11:45:00Z", now)).toBe("15 min ago");
    expect(timeAgo("2026-09-23T07:00:00Z", now)).toBe("5 h ago");
    expect(timeAgo("2026-09-20T12:00:00Z", now)).toBe("3 d ago");
  });

  it("never returns a negative time for clock skew", () => {
    expect(timeAgo("2026-09-23T12:00:30Z", now)).toBe("just now");
  });
});

describe("percentOf", () => {
  it("handles zero and caps at 100", () => {
    expect(percentOf(1, 4)).toBe(25);
    expect(percentOf(3, 0)).toBe(0);
    expect(percentOf(9, 4)).toBe(100);
  });
});

describe("plural", () => {
  it("uses the singular only for exactly one", () => {
    expect(plural(1, "visitor")).toBe("1 visitor");
    expect(plural(0, "visitor")).toBe("0 visitors");
    expect(plural(1200, "view")).toBe("1,200 views");
  });
});
