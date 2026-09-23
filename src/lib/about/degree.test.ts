import { degreeProgress } from "@/lib/about/degree";

const at = (year: number, month: number, day = 1) => new Date(year, month - 1, day);

describe("degreeProgress (Aug 2022 to Jun 2027)", () => {
  const progress = (now: Date) => degreeProgress("2022-08", "2027-06", now)!;

  it("says which year of study a date falls in", () => {
    expect(progress(at(2022, 9)).label).toBe("Year 1 of 5");
    expect(progress(at(2023, 8)).label).toBe("Year 2 of 5"); // Aug 2023 starts year 2
    expect(progress(at(2025, 7)).label).toBe("Year 3 of 5"); // Jul 2025 is still year 3
    expect(progress(at(2025, 8)).label).toBe("Year 4 of 5"); // Aug 2025 starts year 4
    expect(progress(at(2026, 7)).label).toBe("Year 4 of 5");
  });

  it("calls the last year the final year", () => {
    const result = progress(at(2026, 9, 23));
    expect(result.label).toBe("Final year (5 of 5)");
    expect(result.yearOfStudy).toBe(5);
    expect(result.status).toBe("in-progress");
    expect(result.startYear).toBe(2022);
    expect(result.endYear).toBe(2027);
  });

  it("reports progress as a fraction that grows with time", () => {
    const early = progress(at(2023, 8)).progress;
    const late = progress(at(2026, 9, 23)).progress;
    expect(early).toBeCloseTo(12 / 58, 1);
    expect(late).toBeGreaterThan(0.84);
    expect(late).toBeLessThan(0.88);
    expect(late).toBeGreaterThan(early);
  });

  it("clamps before the start and after the end", () => {
    const before = progress(at(2022, 1));
    expect(before.status).toBe("upcoming");
    expect(before.progress).toBe(0);
    expect(before.label).toBe("Starts Aug 2022");

    const after = progress(at(2027, 7));
    expect(after.status).toBe("complete");
    expect(after.progress).toBe(1);
    expect(after.label).toBe("Graduated 2027");
  });

  it("returns null for bad input", () => {
    expect(degreeProgress("soon", "2027-06", at(2026, 1))).toBeNull();
    expect(degreeProgress("2027-06", "2022-08", at(2026, 1))).toBeNull();
    expect(degreeProgress("2022-08", "2022-08", at(2026, 1))).toBeNull();
  });
});
