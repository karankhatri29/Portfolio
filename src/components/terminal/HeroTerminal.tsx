"use client";

import "./terminal.css";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent, ReactNode } from "react";

import { SUGGESTIONS, loadingPhrase, runCommand } from "@/lib/ask/commands";
import type { OutputLine, TerminalContext } from "@/lib/ask/commands";

const MAX_QUESTION = 200;
const REQUEST_TIMEOUT_MS = 20000;
const GENERIC_ERROR = "Something went wrong. Please try again, or email Karan directly.";

// Kept outside the component: reading the clock is fine in event handlers, but not while rendering.
const timestamp = () => Date.now();

type Entry = { id: number; kind: "input" | "output" | "answer" | "error"; text?: string; lines?: OutputLine[] };

const WELCOME: OutputLine[] = [
  { kind: "text", text: "Hi, I'm Karan's terminal." },
  { kind: "text", text: "Type help, or just ask a question about his work." },
];

function renderLine(line: OutputLine, closeTerminal: () => void, key: number) {
  if (line.kind === "text") return <p key={key} className="whitespace-pre-wrap text-muted">{line.text}</p>;
  const style = "text-accent underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent";
  if (line.href.startsWith("/") || line.href.startsWith("#")) {
    return <p key={key}><Link href={line.href} onClick={closeTerminal} className={style}>{line.text}</Link></p>;
  }
  const external = line.href.startsWith("http");
  return <p key={key}><a href={line.href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})} className={style}>{line.text}</a></p>;
}

/**
 * Wraps the hero's terminal card. Tapping the card (or its Ask button) opens a large dialog where
 * built-in commands answer instantly and any other line is sent to the assistant.
 */
export function HeroTerminal({ children, context }: { children: ReactNode; context: TerminalContext }) {
  const titleId = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const log = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const nextId = useRef(0);
  const history = useRef<{ items: string[]; cursor: number }>({ items: [], cursor: 0 });

  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [input, setInput] = useState("");
  const [pendingSince, setPendingSince] = useState<number | null>(null);
  const [now, setNow] = useState(0);

  const pending = pendingSince !== null;
  const add = (entry: Omit<Entry, "id">) => setEntries((current) => [...current, { ...entry, id: nextId.current++ }]);

  // Show or hide the native dialog, lock page scroll while it is open, and put the cursor in the input.
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) {
      if (typeof element.showModal === "function") element.showModal();
      else element.setAttribute("open", "");
      inputRef.current?.focus();
    }
    if (!open && element.open) {
      if (typeof element.close === "function") element.close();
      else element.removeAttribute("open");
    }
    document.documentElement.classList.toggle("terminal-open", open);
    return () => document.documentElement.classList.remove("terminal-open");
  }, [open]);

  // Drives the rotating loading line while an answer is on its way.
  useEffect(() => {
    if (pendingSince === null) return;
    const timer = window.setInterval(() => setNow(timestamp()), 400);
    return () => window.clearInterval(timer);
  }, [pendingSince]);

  useEffect(() => {
    if (log.current) log.current.scrollTop = log.current.scrollHeight;
  }, [entries, pendingSince, open]);

  function openTerminal() {
    if (!entries.length) setEntries(WELCOME.map((line) => ({ id: nextId.current++, kind: "output", lines: [line] })));
    setOpen(true);
  }

  async function ask(question: string) {
    if (question.length > MAX_QUESTION) {
      add({ kind: "error", text: `Please keep questions under ${MAX_QUESTION} characters.` });
      return;
    }
    const started = timestamp();
    setNow(started);
    setPendingSince(started);

    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch("/api/ask", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ question }), signal: controller.signal });
      const data = (await response.json().catch(() => ({}))) as { answer?: string; error?: string };
      if (response.ok && data.answer) add({ kind: "answer", text: data.answer });
      else add({ kind: "error", text: data.error ?? GENERIC_ERROR });
    } catch {
      add({ kind: "error", text: GENERIC_ERROR });
    } finally {
      window.clearTimeout(timer);
      setPendingSince(null);
      window.requestAnimationFrame(() => inputRef.current?.focus());
    }
  }

  function submit(raw: string) {
    const value = raw.trim();
    if (!value || pending) return;

    add({ kind: "input", text: value });
    history.current = { items: [...history.current.items, value], cursor: history.current.items.length + 1 };
    setInput("");

    const result = runCommand(value, context);
    if (result.type === "output") add({ kind: "output", lines: result.lines });
    else if (result.type === "clear") setEntries([]);
    else if (result.type === "close") setOpen(false);
    else if (result.type === "ask") void ask(result.question);
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    submit(input);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    const { items, cursor } = history.current;
    if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
    event.preventDefault();
    const next = Math.min(items.length, Math.max(0, cursor + (event.key === "ArrowUp" ? -1 : 1)));
    history.current.cursor = next;
    setInput(items[next] ?? "");
  }

  const closeTerminal = () => setOpen(false);

  return (
    <div className="relative">
      <div onClick={openTerminal} className="cursor-pointer">{children}</div>
      <button
        type="button"
        onClick={openTerminal}
        aria-label="Open the interactive terminal and ask Karan a question"
        className="absolute right-3 top-2 z-10 flex items-center gap-1.5 rounded-full border border-accent/40 px-2.5 py-1 font-mono text-[11px] font-semibold text-accent transition hover:bg-accent hover:text-paper focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-accent motion-safe:animate-pulse" />
        Ask
        <span aria-hidden="true">↗</span>
      </button>

      <dialog
        ref={dialog}
        aria-labelledby={titleId}
        className="hero-terminal-dialog"
        onClose={() => setOpen(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) setOpen(false);
        }}
      >
        {open ? (
          <div className="flex h-full flex-col overflow-hidden border border-ink/15 bg-paper font-mono text-sm shadow-2xl shadow-black/60">
            <div className="flex items-center gap-2 border-b border-ink/10 px-4 py-3">
              <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-ink/25" />
              <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-ink/25" />
              <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-ink/25" />
              <h2 id={titleId} className="ml-2 text-xs font-normal text-muted">karan@portfolio: ask</h2>
              <button type="button" onClick={closeTerminal} aria-label="Close terminal" className="ml-auto rounded px-2 py-1 text-xs text-muted transition hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">
                Esc ✕
              </button>
            </div>

            <div ref={log} role="log" aria-live="polite" aria-label="Terminal output" className="flex-1 space-y-2 overflow-y-auto px-5 py-4 leading-6">
              {entries.map((entry) => {
                if (entry.kind === "input") return <p key={entry.id} className="text-ink"><span aria-hidden="true" className="pr-2 text-accent">$</span>{entry.text}</p>;
                if (entry.kind === "answer") return <p key={entry.id} className="border-l-2 border-accent/60 pl-3 text-ink">{entry.text}</p>;
                if (entry.kind === "error") return <p key={entry.id} className="text-muted"><span aria-hidden="true">! </span>{entry.text}</p>;
                return <div key={entry.id} className="space-y-0.5">{entry.lines?.map((line, index) => renderLine(line, closeTerminal, index))}</div>;
              })}
              {pending ? (
                <p role="status" className="text-muted">
                  <span className="sr-only">Working on an answer</span>
                  <span aria-hidden="true">{loadingPhrase(now - (pendingSince ?? now))}<span className="term-cursor ml-1 inline-block h-3.5 w-2 translate-y-0.5 bg-accent" /></span>
                </p>
              ) : null}
            </div>

            <div className="border-t border-ink/10 px-5 pb-4 pt-3">
              <ul aria-label="Suggested questions" className="mb-3 flex flex-wrap gap-2">
                {SUGGESTIONS.map((suggestion) => (
                  <li key={suggestion}>
                    <button type="button" disabled={pending} onClick={() => submit(suggestion)} className="rounded-full border border-ink/15 px-3 py-1 text-xs text-muted transition hover:border-accent hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-40">
                      {suggestion}
                    </button>
                  </li>
                ))}
              </ul>
              <form onSubmit={onSubmit} className="flex items-center gap-2">
                <label htmlFor={`${titleId}-input`} className="sr-only">Type a command or ask a question about Karan</label>
                <span aria-hidden="true" className="text-accent">$</span>
                <input
                  id={`${titleId}-input`}
                  ref={inputRef}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={onKeyDown}
                  disabled={pending}
                  maxLength={MAX_QUESTION + 20}
                  autoComplete="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  enterKeyHint="send"
                  placeholder={pending ? "" : "help, or ask about Karan's work…"}
                  className="min-w-0 flex-1 bg-transparent text-ink placeholder:text-muted/60 focus:outline-none disabled:opacity-60"
                />
              </form>
              <p className="mt-3 text-[11px] leading-4 text-muted">Answers come from Gemini and only cover Karan&apos;s work. Please don&apos;t share anything sensitive.</p>
            </div>
          </div>
        ) : null}
      </dialog>
    </div>
  );
}
