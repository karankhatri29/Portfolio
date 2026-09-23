export type CsvValue = string | number | boolean | null;

// Spreadsheet apps run cells that start with these characters as formulas.
const formulaStart = /^[=+\-@\t\r]/;

function cell(value: CsvValue): string {
  if (value === null) return "";
  if (typeof value !== "string") return String(value);

  const safe = formulaStart.test(value) ? `'${value}` : value;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export function toCsv(columns: string[], rows: CsvValue[][]): string {
  return [columns, ...rows].map((row) => row.map(cell).join(",")).join("\r\n") + "\r\n";
}
