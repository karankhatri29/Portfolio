"use client";

import { useEffect, useId, useRef } from "react";

import { dangerButton } from "@/components/IconButton";

/**
 * "Delete X? This can't be undone." as a real pop-up. Pass the name of what is about to be deleted to open it, or null to close it.
 * Esc and a click outside both cancel. Built on the browser's own dialog, so focus is trapped and returned for free.
 */
export function ConfirmDialog({ name, onConfirm, onCancel }: { name: string | null; onConfirm: () => void; onCancel: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const open = name !== null;

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) {
      if (typeof element.showModal === "function") element.showModal();
      else element.setAttribute("open", "");
    }
    if (!open && element.open) {
      if (typeof element.close === "function") element.close();
      else element.removeAttribute("open");
    }
  }, [open]);

  return (
    <dialog
      ref={dialog}
      aria-labelledby={titleId}
      onClose={onCancel}
      onClick={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
      className="m-auto w-[min(92vw,26rem)] border border-accent/25 bg-[#05080c] p-0 text-ink shadow-[0_0_80px_-20px_rgb(var(--color-accent)/0.55)] backdrop:bg-black/70 backdrop:backdrop-blur-sm"
    >
      {open ? (
        <div className="p-6">
          <h2 id={titleId} className="font-display text-xl font-semibold leading-snug">Delete &ldquo;{name}&rdquo;?</h2>
          <p className="mt-2 text-sm leading-6 text-muted">This can&apos;t be undone.</p>
          <div className="mt-6 flex justify-end gap-3">
            <button type="button" autoFocus onClick={onCancel} className="rounded-full border border-ink/20 px-5 py-2.5 text-sm font-semibold text-ink transition hover:border-accent hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">Cancel</button>
            <button type="button" aria-label={`Confirm delete ${name}`} onClick={onConfirm} className={dangerButton}>Delete</button>
          </div>
        </div>
      ) : null}
    </dialog>
  );
}
