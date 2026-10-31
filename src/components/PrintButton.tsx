"use client";

export function PrintButton({ label = "Save as PDF" }: { label?: string }) {
  return (
    <button type="button" onClick={() => window.print()} className="print:hidden inline-flex min-h-11 items-center rounded-full border border-accent bg-transparent px-6 text-sm font-semibold text-accent transition duration-300 hover:bg-accent hover:text-paper focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper">
      {label}
    </button>
  );
}
