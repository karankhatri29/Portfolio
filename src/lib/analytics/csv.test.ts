import { toCsv } from "@/lib/analytics/csv";

describe("toCsv", () => {
  it("writes a header row and quotes cells with commas, quotes and newlines", () => {
    const csv = toCsv(["name", "note"], [["Ada", 'said "hi", left'], ["Grace", "line1\nline2"]]);

    expect(csv).toBe('name,note\r\nAda,"said ""hi"", left"\r\nGrace,"line1\nline2"\r\n');
  });

  it("renders numbers, booleans and nulls without quoting", () => {
    expect(toCsv(["a", "b", "c"], [[12, true, null]])).toBe("a,b,c\r\n12,true,\r\n");
  });

  it("neutralises spreadsheet formulas in text cells but leaves negative numbers alone", () => {
    const csv = toCsv(["v"], [["=HYPERLINK(\"http://evil\")"], ["+1"], ["-cmd"], ["@SUM(A1)"], [-5]]);
    const lines = csv.trim().split("\r\n");

    expect(lines[1]).toBe('"\'=HYPERLINK(""http://evil"")"');
    expect(lines.slice(2)).toEqual(["'+1", "'-cmd", "'@SUM(A1)", "-5"]);
  });
});
