"use client";

export function PrintButton({ label = "Save as PDF" }: { label?: string }) {
  return (
    <button type="button" onClick={() => window.print()} className="border border-accent px-4 py-2 text-sm font-semibold text-accent focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-paper print:hidden">
      {label}
    </button>
  );
}
