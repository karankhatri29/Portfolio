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

const PROMPT = "karan@k3 ~ %";
// The built-in commands, for Tab completion.
const COMMANDS = ["help", "whoami", "skills", "projects", "contact", "clear", "exit"];

// Kept outside the component: reading the clock is fine in event handlers, but not while rendering.
const timestamp = () => Date.now();

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "Last login: Sat Nov  1 21:04:12 on ttys001": the line a real shell prints when it starts. */
function loginBanner(at: number) {
  const date = new Date(at);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `Last login: ${DAYS[date.getDay()]} ${MONTHS[date.getMonth()]} ${String(date.getDate()).padStart(2, " ")} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())} on ttys001`;
}

type Entry = { id: number; kind: "input" | "output" | "answer" | "error"; text?: string; lines?: OutputLine[] };

const WELCOME: OutputLine[] = [
  { kind: "text", text: "Hi, I'm Karan's terminal." },
  { kind: "text", text: "Type help, or just ask a question about his work." },
];

function renderLine(line: OutputLine, closeTerminal: () => void, key: number) {
  if (line.kind === "text") return <p key={key} className="whitespace-pre-wrap text-ink/75">{line.text}</p>;
  const style = "text-accent underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent";
  if (line.href.startsWith("/") || line.href.startsWith("#")) {
    return <p key={key}><Link href={line.href} onClick={closeTerminal} className={style}>{line.text}</Link></p>;
  }
  const external = line.href.startsWith("http");
  return <p key={key}><a href={line.href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})} className={style}>{line.text}</a></p>;
}

const prefersReducedMotion = () => typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * An answer from the assistant, written out as if it were streaming in. Screen readers get the whole answer at once from a
 * hidden copy; once the writing finishes (or with reduced motion) only the plain text remains.
 */
function TypedText({ text }: { text: string }) {
  const [shown, setShown] = useState(0);
  const instant = prefersReducedMotion();

  useEffect(() => {
    if (instant) return;
    const perTick = Math.max(1, Math.ceil(text.length / 150)); // long answers speed up, so none takes more than a couple of seconds
    let count = 0;
    const timer = setInterval(() => {
      count = Math.min(text.length, count + perTick);
      setShown(count);
      if (count >= text.length) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [text, instant]);

  if (instant || shown >= text.length) return <>{text}</>;
  return (
    <>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">{text.slice(0, shown)}<span className="term-cursor ml-px inline-block h-3.5 w-2 translate-y-0.5 bg-accent" /></span>
    </>
  );
}

const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

function Spinner() {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setFrame((current) => (current + 1) % SPINNER_FRAMES.length), 80);
    return () => clearInterval(timer);
  }, []);
  return <span aria-hidden="true" className="text-accent">{SPINNER_FRAMES[frame]}</span>;
}

/**
 * Wraps the hero's terminal card. Tapping the card opens a large, realistic terminal: built-in commands answer
 * instantly, Tab completes them, and any other line is sent to the assistant.
 */
export function HeroTerminal({ children, context }: { children: ReactNode; context: TerminalContext }) {
  const titleId = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
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

  // Like a real terminal, the newest line (and the prompt under it) stays in view.
  useEffect(() => {
    if (scroller.current) scroller.current.scrollTop = scroller.current.scrollHeight;
  }, [entries, pendingSince, open]);

  function openTerminal() {
    if (!entries.length) {
      setEntries([{ id: nextId.current++, kind: "output", lines: [{ kind: "text", text: loginBanner(timestamp()) }, ...WELCOME] }]);
    }
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

  // Tab, like a shell: finish a command name, list the options when several fit, or fill in "help" on an empty line.
  function complete() {
    const word = input.trim().toLowerCase();
    if (!word) {
      setInput("help");
      return;
    }
    if (/\s/.test(word)) return;
    const matches = COMMANDS.filter((command) => command.startsWith(word));
    if (matches.length === 1) setInput(matches[0]);
    else if (matches.length > 1) {
      add({ kind: "input", text: input });
      add({ kind: "output", lines: [{ kind: "text", text: matches.join("   ") }] });
    }
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.ctrlKey && event.key.toLowerCase() === "l") {
      event.preventDefault();
      setEntries([]);
      return;
    }
    // Ctrl+C abandons the line, as in a shell, unless text is selected (then the browser should copy it).
    if (event.ctrlKey && event.key.toLowerCase() === "c" && inputRef.current?.selectionStart === inputRef.current?.selectionEnd) {
      event.preventDefault();
      if (input) add({ kind: "input", text: `${input}^C` });
      setInput("");
      return;
    }
    if (event.key === "Tab") {
      event.preventDefault();
      complete();
      return;
    }
    const { items, cursor } = history.current;
    if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
    event.preventDefault();
    const next = Math.min(items.length, Math.max(0, cursor + (event.key === "ArrowUp" ? -1 : 1)));
    history.current.cursor = next;
    setInput(items[next] ?? "");
  }

  const closeTerminal = () => setOpen(false);
  // Clicking anywhere on the screen puts the cursor back on the prompt, unless the visitor is selecting text to copy.
  const focusPrompt = () => {
    if (!window.getSelection()?.toString()) inputRef.current?.focus();
  };

  return (
    <div className="relative">
      <div onClick={openTerminal} className="cursor-pointer">{children}</div>
      <button
        type="button"
        onClick={openTerminal}
        aria-label="Open the interactive terminal and ask Karan a question"
        className="absolute inset-0 z-10 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      />

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
          <div className="flex h-full flex-col overflow-hidden border border-accent/25 bg-[#05080c] font-mono text-sm shadow-[0_0_90px_-20px_rgb(var(--color-accent)/0.55)]">
            <div className="flex items-center gap-2 border-b border-ink/10 bg-ink/[0.045] px-4 py-2.5">
              <button type="button" onClick={closeTerminal} aria-label="Close terminal" className="group -m-2 flex h-8 w-8 items-center justify-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">
                <span aria-hidden="true" className="h-3 w-3 rounded-full bg-[#ff5f57] transition group-hover:brightness-125" />
              </button>
              <span aria-hidden="true" className="h-3 w-3 rounded-full bg-[#febc2e]/45" />
              <span aria-hidden="true" className="h-3 w-3 rounded-full bg-[#28c840]/45" />
              <h2 id={titleId} className="ml-3 text-xs font-normal text-muted">karan@k3: ~/portfolio</h2>
            </div>

            <div ref={scroller} onClick={focusPrompt} className="flex-1 overflow-y-auto px-5 py-4 leading-[1.65] selection:bg-accent/30">
              <div role="log" aria-live="polite" aria-label="Terminal output" className="space-y-2">
                {entries.map((entry) => {
                  if (entry.kind === "input") return <p key={entry.id} className="text-ink"><span aria-hidden="true" className="pr-2 text-accent">{PROMPT}</span>{entry.text}</p>;
                  if (entry.kind === "answer") return <p key={entry.id} className="border-l-2 border-accent/60 pl-3 text-ink"><TypedText text={entry.text ?? ""} /></p>;
                  if (entry.kind === "error") return <p key={entry.id} className="text-[#ff8a80]"><span aria-hidden="true">! </span>{entry.text}</p>;
                  return <div key={entry.id} className="space-y-0.5">{entry.lines?.map((line, index) => renderLine(line, closeTerminal, index))}</div>;
                })}
                {pending ? (
                  <p role="status" className="text-ink/75">
                    <span className="sr-only">Working on an answer</span>
                    <span aria-hidden="true"><Spinner /> {loadingPhrase(now - (pendingSince ?? now))}</span>
                  </p>
                ) : null}
              </div>

              <form onSubmit={onSubmit} className="mt-2 flex items-center gap-2">
                <label htmlFor={`${titleId}-input`} className="sr-only">Type a command or ask a question about Karan</label>
                <span aria-hidden="true" className="shrink-0 text-accent">{PROMPT}</span>
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
                  className="min-w-0 flex-1 bg-transparent text-ink caret-accent [caret-shape:block] placeholder:text-muted/50 focus:outline-none disabled:opacity-60"
                />
              </form>
            </div>

            <ul aria-label="Suggested questions" className="flex gap-2 overflow-x-auto border-t border-ink/10 px-4 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {SUGGESTIONS.map((suggestion) => (
                <li key={suggestion} className="shrink-0">
                  <button type="button" disabled={pending} onClick={() => submit(suggestion)} className="whitespace-nowrap rounded border border-ink/15 px-3 py-1.5 text-xs text-muted transition hover:border-accent hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-40">
                    {suggestion}
                  </button>
                </li>
              ))}
            </ul>

            <div className="flex items-center justify-between gap-4 border-t border-accent/20 bg-accent/10 px-4 py-1.5 text-[11px] leading-4 text-ink/80">
              <span aria-hidden="true" className="hidden shrink-0 text-accent sm:block">[k3] 0:zsh*</span>
              <p>Answers are written by an LLM and only cover Karan&apos;s work. Please don&apos;t share anything sensitive.</p>
            </div>
          </div>
        ) : null}
      </dialog>
    </div>
  );
}
