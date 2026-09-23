"use client";

import { useState } from "react";
import type { FormEvent } from "react";

type Status =
  | { kind: "idle" }
  | { kind: "pending" }
  | { kind: "success" }
  | { kind: "validation"; errors: string[] }
  | { kind: "server"; message: string };

const inputClass = "mt-1 block w-full border border-ink/20 bg-paper px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-accent";
const empty = { name: "", email: "", message: "", website: "" };

export function ContactForm() {
  const [form, setForm] = useState(empty);
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function submit(event: FormEvent) {
    event.preventDefault();
    setStatus({ kind: "pending" });

    try {
      const response = await fetch("/api/contact", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(form) });
      const data = (await response.json().catch(() => ({}))) as { errors?: unknown; error?: unknown };

      if (response.ok) {
        setForm(empty);
        return setStatus({ kind: "success" });
      }
      if (response.status === 400 && Array.isArray(data.errors)) {
        return setStatus({ kind: "validation", errors: data.errors.filter((error): error is string => typeof error === "string") });
      }
      setStatus({ kind: "server", message: typeof data.error === "string" ? data.error : "Something went wrong. Please try again." });
    } catch {
      setStatus({ kind: "server", message: "Could not reach the server. Please try again." });
    }
  }

  return (
    <form onSubmit={submit} aria-label="Send a message" className="grid max-w-xl gap-4">
      <label className="block text-sm font-medium">Your name
        <input className={inputClass} value={form.name} autoComplete="name" onChange={(event) => setForm({ ...form, name: event.target.value })} />
      </label>
      <label className="block text-sm font-medium">Your email
        <input className={inputClass} type="email" value={form.email} autoComplete="email" onChange={(event) => setForm({ ...form, email: event.target.value })} />
      </label>
      <label className="block text-sm font-medium">Message
        <textarea className={inputClass} rows={5} value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} />
      </label>
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>Leave this empty
          <input tabIndex={-1} autoComplete="off" value={form.website} onChange={(event) => setForm({ ...form, website: event.target.value })} />
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" disabled={status.kind === "pending"} className="border border-accent px-4 py-2 text-sm font-semibold text-accent focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-paper disabled:opacity-50">
          Send message
        </button>
        {status.kind === "pending" ? <p role="status" className="text-sm text-muted">Sending...</p> : null}
        {status.kind === "success" ? <p role="status" className="text-sm text-accent">Thanks, your message was sent.</p> : null}
        {status.kind === "server" ? <p role="alert" className="text-sm text-red-700">{status.message}</p> : null}
        {status.kind === "validation" ? <ul role="alert" className="list-disc pl-5 text-sm text-red-700">{status.errors.map((error) => <li key={error}>{error}</li>)}</ul> : null}
      </div>
    </form>
  );
}
