"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import type { FormEvent } from "react";

type Status =
  | { kind: "idle" }
  | { kind: "pending" }
  | { kind: "success" }
  | { kind: "validation"; errors: string[] }
  | { kind: "server"; message: string };

// The label starts inside the box and floats up to the top edge when the field is focused or has text, so it never covers what is typed.
const fieldClass = "peer block w-full rounded-md border border-ink/20 bg-ink/[0.04] px-3 pb-2 pt-6 text-base text-ink placeholder-transparent transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40";
const labelClass = "pointer-events-none absolute left-3 top-4 origin-left text-base text-muted transition-all duration-200 peer-focus:top-1.5 peer-focus:text-xs peer-focus:text-accent peer-[:not(:placeholder-shown)]:top-1.5 peer-[:not(:placeholder-shown)]:text-xs";
const empty = { name: "", email: "", message: "", website: "" };
const TOAST_MS = 6000;

export function ContactForm() {
  const [form, setForm] = useState(empty);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [toast, setToast] = useState(false);
  const baseId = useId();

  // The "message sent" notification dismisses itself after a few seconds.
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(false), TOAST_MS);
    return () => window.clearTimeout(timer);
  }, [toast]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setStatus({ kind: "pending" });

    try {
      const response = await fetch("/api/contact", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(form) });
      const data = (await response.json().catch(() => ({}))) as { errors?: unknown; error?: unknown };

      if (response.ok) {
        setForm(empty);
        setToast(true);
        return setStatus({ kind: "success" });
      }
      if (response.status === 400 && Array.isArray(data.errors)) {
        return setStatus({ kind: "validation", errors: data.errors.filter((error): error is string => typeof error === "string") });
      }
      setStatus({ kind: "server", message: typeof data.error === "string" ? data.error : "Something went wrong. Please try again." });
    } catch {
      setStatus({ kind: "server", message: "Could not reach the server. Check your connection and try again." });
    }
  }

  return (
    <form onSubmit={submit} aria-label="Send a message" className="grid max-w-xl gap-4">
      <div className="relative">
        <input id={`${baseId}-name`} className={fieldClass} placeholder=" " value={form.name} autoComplete="name" onChange={(event) => setForm({ ...form, name: event.target.value })} />
        <label htmlFor={`${baseId}-name`} className={labelClass}>Your name</label>
      </div>
      <div className="relative">
        <input id={`${baseId}-email`} className={fieldClass} placeholder=" " type="email" value={form.email} autoComplete="email" onChange={(event) => setForm({ ...form, email: event.target.value })} />
        <label htmlFor={`${baseId}-email`} className={labelClass}>Your email</label>
      </div>
      <div className="relative">
        <textarea id={`${baseId}-message`} className={fieldClass} placeholder=" " rows={5} value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} />
        <label htmlFor={`${baseId}-message`} className={labelClass}>Message</label>
      </div>
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>Leave this empty
          <input tabIndex={-1} autoComplete="off" value={form.website} onChange={(event) => setForm({ ...form, website: event.target.value })} />
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" disabled={status.kind === "pending"} className="rounded-full border border-accent bg-transparent px-6 py-2.5 text-sm font-semibold text-accent transition duration-300 hover:bg-accent hover:text-paper focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper disabled:opacity-50">
          Send message
        </button>
        <p className="basis-full text-xs text-muted">Your message is stored so I can reply. See the <Link href="/privacy" className="underline underline-offset-4 hover:text-accent">privacy page</Link>.</p>
        {status.kind === "pending" ? <p role="status" className="text-sm text-muted">Sending...</p> : null}
        {status.kind === "server" ? <p role="alert" className="text-sm text-[#ff8a80]">{status.message}</p> : null}
        {status.kind === "validation" ? <ul role="alert" className="list-disc pl-5 text-sm text-[#ff8a80]">{status.errors.map((error) => <li key={error}>{error}</li>)}</ul> : null}
      </div>

      {toast ? (
        <div role="status" className="toast-in fixed bottom-6 left-1/2 z-50 flex w-[min(92vw,24rem)] -translate-x-1/2 items-start gap-3 border border-accent/40 bg-[#05080c]/95 p-4 shadow-[0_0_50px_-10px_rgb(var(--color-accent)/0.6)] backdrop-blur-xl">
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 h-6 w-6 shrink-0 text-accent drop-shadow-[0_0_8px_rgb(var(--color-accent)/0.8)]">
            <circle cx="12" cy="12" r="10" />
            <path d="m8 12 3 3 5-6" />
          </svg>
          <div className="min-w-0 flex-1">
            <p className="font-display font-semibold">Message sent</p>
            <p className="mt-0.5 text-sm text-muted">Thanks, your message was sent.</p>
          </div>
          <button type="button" aria-label="Dismiss notification" onClick={() => setToast(false)} className="-mr-1 -mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg leading-none text-muted transition hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">&times;</button>
        </div>
      ) : null}
    </form>
  );
}
