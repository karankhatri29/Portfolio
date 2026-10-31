"use client";

import { useEffect, useState } from "react";

const TYPE_MS = 70;
const ERASE_MS = 32;
const HOLD_MS = 1700;
const PAUSE_MS = 500;

/**
 * The shell's live prompt: it types a command, leaves it hanging for a moment, erases it and starts another.
 * The commands never run. An unfinished line draws the eye, and that curiosity does the inviting.
 * Purely decorative, so it is hidden from assistive technology; with reduced motion it just shows the first command.
 */
export function TeaserLine({ commands, prompt }: { commands: string[]; prompt: string }) {
  const [text, setText] = useState("");
  const reduced = typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (reduced || commands.length === 0) return;
    let index = 0;
    let shown = 0;
    let timer: ReturnType<typeof setTimeout>;

    const type = () => {
      shown += 1;
      setText(commands[index].slice(0, shown));
      timer = setTimeout(shown >= commands[index].length ? () => { timer = setTimeout(erase, HOLD_MS); } : type, TYPE_MS);
    };
    const erase = () => {
      shown -= 1;
      setText(commands[index].slice(0, Math.max(0, shown)));
      if (shown <= 0) {
        index = (index + 1) % commands.length;
        timer = setTimeout(type, PAUSE_MS);
      } else timer = setTimeout(erase, ERASE_MS);
    };

    // Start after the real commands above have finished typing.
    timer = setTimeout(type, 4200);
    return () => clearTimeout(timer);
  }, [commands, reduced]);

  return (
    <p aria-hidden="true" className="flex whitespace-pre text-ink">
      <span className="pr-2 text-accent">{prompt}</span>
      <span>{reduced ? commands[0] : text}</span>
      <span className="term-cursor ml-px inline-block h-4 w-2 translate-y-1 bg-accent" />
    </p>
  );
}
