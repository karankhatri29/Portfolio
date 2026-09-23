"use client";

import { useState } from "react";

import type { ContactMessage, MessageStatus } from "@/lib/analytics/repository";

const filters: { value: MessageStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "new", label: "New" },
  { value: "replied", label: "Replied" },
  { value: "archived", label: "Archived" },
];

const buttonClass = "border border-ink/20 px-3 py-1 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-accent";

export function MessageInbox({ initialMessages }: { initialMessages: ContactMessage[] }) {
  const [messages, setMessages] = useState(initialMessages);
  const [filter, setFilter] = useState<MessageStatus | "all">("all");
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function changeStatus(id: string, status: MessageStatus) {
    setBusyId(id);
    setError(null);

    try {
      const response = await fetch("/api/messages", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, status }) });
      if (!response.ok) throw new Error("failed");
      setMessages((current) => current.map((message) => (message.id === id ? { ...message, status } : message)));
    } catch {
      setError("Could not update that message. Please try again.");
    } finally {
      setBusyId(null);
    }
  }

  const visible = filter === "all" ? messages : messages.filter((message) => message.status === filter);
  const count = (value: MessageStatus | "all") => (value === "all" ? messages.length : messages.filter((message) => message.status === value).length);

  return (
    <div>
      <div role="group" aria-label="Filter messages" className="mt-4 flex flex-wrap gap-2">
        {filters.map((item) => (
          <button key={item.value} type="button" aria-pressed={filter === item.value} onClick={() => setFilter(item.value)} className={`${buttonClass} ${filter === item.value ? "bg-accent text-paper" : ""}`}>
            {item.label} ({count(item.value)})
          </button>
        ))}
      </div>
      {error ? <p role="alert" className="mt-3 text-sm text-red-700">{error}</p> : null}
      {visible.length === 0 ? <p className="mt-4 text-sm text-muted">No messages here yet.</p> : (
        <ul className="mt-4 divide-y divide-ink/10 border border-ink/10">
          {visible.map((message) => (
            <li key={message.id} className="p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-semibold">{message.name} <a href={`mailto:${message.email}`} className="text-sm font-normal text-accent underline underline-offset-4">{message.email}</a></p>
                <p className="text-xs text-muted"><time dateTime={message.createdAt}>{new Date(message.createdAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" })} UTC</time> · {message.status}</p>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{message.message}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(["new", "replied", "archived"] as MessageStatus[]).filter((status) => status !== message.status).map((status) => (
                  <button key={status} type="button" disabled={busyId === message.id} onClick={() => changeStatus(message.id, status)} className={buttonClass}>
                    Mark {status} <span className="sr-only">for {message.name}</span>
                  </button>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
