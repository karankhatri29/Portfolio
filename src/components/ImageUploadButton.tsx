"use client";

import { useRef, useState } from "react";
import type { ChangeEvent } from "react";

type State = { kind: "idle" } | { kind: "uploading" } | { kind: "error"; message: string };

export function ImageUploadButton({ onUploaded, label = "Upload image" }: { onUploaded: (url: string, fileName: string) => void; label?: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<State>({ kind: "idle" });

  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setState({ kind: "uploading" });
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/api/upload", { method: "POST", body });
      const data = (await response.json().catch(() => ({}))) as { url?: unknown; error?: unknown };

      if (!response.ok || typeof data.url !== "string") {
        setState({ kind: "error", message: typeof data.error === "string" ? data.error : "Upload failed. Please try again." });
        return;
      }
      setState({ kind: "idle" });
      onUploaded(data.url, file.name);
    } catch {
      setState({ kind: "error", message: "Could not reach the server. Please try again." });
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <input ref={input} type="file" accept="image/png,image/jpeg,image/gif,image/webp" className="sr-only" aria-label={label} tabIndex={-1} onChange={handleChange} />
      <button type="button" disabled={state.kind === "uploading"} onClick={() => input.current?.click()} className="border border-ink/30 px-3 py-1.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50">
        {state.kind === "uploading" ? "Uploading..." : label}
      </button>
      {state.kind === "error" ? <p role="alert" className="text-sm text-red-700">{state.message}</p> : null}
    </div>
  );
}
