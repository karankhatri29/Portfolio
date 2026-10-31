// A pen or a bin as a round, 44px button. The visible label is the icon; the accessible name (and tooltip) is the full action,
// for example "Edit AI and NLP", so screen readers and tests still find it by name.
const ICONS = {
  edit: (
    <>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </>
  ),
  delete: (
    <>
      <path d="M3 6h18" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </>
  ),
};

const base = "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-ink/15 text-muted transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-40";
const tone = {
  edit: "hover:border-accent hover:text-accent",
  // The bin turns red on hover, so it reads as the destructive one before it is pressed.
  delete: "hover:border-[#ff6b6b] hover:bg-[#ff6b6b]/10 hover:text-[#ff8a80]",
};

/** The explicit second step of a delete. Words, not an icon: a destructive confirmation should never be ambiguous. */
export const dangerButton = "rounded-full border border-[#ff6b6b] bg-[#ff6b6b]/10 px-4 py-2.5 text-xs font-semibold text-[#ff8a80] transition hover:bg-[#ff6b6b]/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6b6b]";

export function IconButton({ kind, label, onClick, disabled }: { kind: "edit" | "delete"; label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} disabled={disabled} className={`${base} ${tone[kind]}`}>
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
        {ICONS[kind]}
      </svg>
    </button>
  );
}
