"use client";

import Link from "next/link";
import { useState } from "react";
import type { FormEvent } from "react";

import { ImageUploadButton } from "@/components/ImageUploadButton";
import { MarkdownContent } from "@/components/MarkdownContent";
import { formatPostDate, readingMinutes } from "@/lib/content/blog-utils";
import type { BlogPost, PostStatus } from "@/lib/content/blog";

type Status =
  | { kind: "idle" }
  | { kind: "pending" }
  | { kind: "success"; message: string }
  | { kind: "validation"; errors: string[] }
  | { kind: "server"; message: string };

type Form = { slug: string; title: string; date: string; summary: string; content: string; tags: string; status: PostStatus };

const inputClass = "mt-1 block w-full border border-ink/20 bg-paper px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-accent";
const primaryButton = "border border-accent px-4 py-2 text-sm font-semibold text-accent focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-paper disabled:opacity-50";
const linkButton = "text-sm font-semibold text-accent underline underline-offset-4 focus:outline-none focus:ring-2 focus:ring-accent";

const today = () => new Date().toISOString().slice(0, 10);
const emptyForm = (): Form => ({ slug: "", title: "", date: today(), summary: "", content: "", tags: "", status: "draft" });
const slugFromTitle = (title: string) => title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);

async function send(method: string, body: unknown): Promise<{ ok: true; data: Record<string, unknown> } | { ok: false; status: Status }> {
  try {
    const response = await fetch("/api/posts", { method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;

    if (response.ok) return { ok: true, data };
    if (response.status === 400 && Array.isArray(data.errors)) return { ok: false, status: { kind: "validation", errors: data.errors.filter((error): error is string => typeof error === "string") } };
    return { ok: false, status: { kind: "server", message: typeof data.error === "string" ? data.error : "Something went wrong. Please try again." } };
  } catch {
    return { ok: false, status: { kind: "server", message: "Could not reach the server. Please try again." } };
  }
}

export function BlogEditor({ initialPosts }: { initialPosts: BlogPost[] }) {
  const [posts, setPosts] = useState(initialPosts);
  const [form, setForm] = useState<Form>(emptyForm);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const [confirmingSlug, setConfirmingSlug] = useState<string | null>(null);
  const [preview, setPreview] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const pending = status.kind === "pending";

  function startEdit(post: BlogPost) {
    setEditingSlug(post.slug);
    setConfirmingSlug(null);
    setForm({ slug: post.slug, title: post.title, date: post.date, summary: post.summary, content: post.content, tags: post.tags.join(", "), status: post.status });
    setStatus({ kind: "idle" });
  }

  function reset() {
    setEditingSlug(null);
    setSlugTouched(false);
    setForm(emptyForm());
  }

  function setTitle(title: string) {
    setForm((current) => ({ ...current, title, slug: editingSlug || slugTouched ? current.slug : slugFromTitle(title) }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setStatus({ kind: "pending" });
    const payload = { ...form, tags: form.tags.split(",").map((tag) => tag.trim()).filter(Boolean) };
    const result = await send(editingSlug ? "PATCH" : "POST", payload);
    if (!result.ok) return setStatus(result.status);

    const saved = result.data.post as BlogPost;
    setPosts((current) => (editingSlug ? current.map((post) => (post.slug === saved.slug ? saved : post)) : [saved, ...current]));
    setStatus({ kind: "success", message: saved.status === "published" ? "Post saved and published." : "Draft saved." });
    reset();
  }

  async function remove(slug: string) {
    setConfirmingSlug(null);
    setStatus({ kind: "pending" });
    const result = await send("DELETE", { slug });
    if (!result.ok) return setStatus(result.status);

    setPosts((current) => current.filter((post) => post.slug !== slug));
    if (editingSlug === slug) reset();
    setStatus({ kind: "success", message: "Post deleted." });
  }

  return (
    <div>
      <section aria-labelledby="posts-title">
        <h2 id="posts-title" className="font-display text-2xl font-semibold">Posts</h2>
        {posts.length ? (
          <ul className="mt-6 divide-y divide-ink/10 border border-ink/10">
            {posts.map((post) => (
              <li key={post.slug} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <span>
                  <span className="font-semibold">{post.title}</span>{" "}
                  <span className={`ml-1 rounded-full border px-2 py-0.5 text-xs ${post.status === "published" ? "border-green-600 text-green-600" : "border-ink/30 text-muted"}`}>{post.status}</span>
                  <span className="ml-2 text-sm text-muted">{formatPostDate(post.date)}</span>
                </span>
                <span className="flex gap-4">
                  <Link href={`/blog/${post.slug}`} className={linkButton}>{post.status === "published" ? "View" : "Preview"} <span className="sr-only">{post.title}</span></Link>
                  <button type="button" className={linkButton} onClick={() => startEdit(post)}>Edit {post.title}</button>
                  {confirmingSlug === post.slug
                    ? <button type="button" className={linkButton} onClick={() => remove(post.slug)}>Confirm delete {post.title}</button>
                    : <button type="button" className={linkButton} onClick={() => setConfirmingSlug(post.slug)}>Delete {post.title}</button>}
                </span>
              </li>
            ))}
          </ul>
        ) : <p className="mt-6 text-muted">No posts yet.</p>}
      </section>

      <form onSubmit={submit} className="mt-10 grid gap-4" aria-label={editingSlug ? "Edit post" : "New post"}>
        <h2 className="font-display text-2xl font-semibold">{editingSlug ? "Edit post" : "New post"}</h2>
        <label className="block text-sm font-medium">Title
          <input className={inputClass} value={form.title} onChange={(event) => setTitle(event.target.value)} />
        </label>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block text-sm font-medium">Slug (the web address)
            <input className={inputClass} value={form.slug} disabled={editingSlug !== null} onChange={(event) => { setSlugTouched(true); setForm({ ...form, slug: event.target.value }); }} />
          </label>
          <label className="block text-sm font-medium">Date
            <input className={inputClass} type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} />
          </label>
          <label className="block text-sm font-medium">Status
            <select className={inputClass} value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as PostStatus })}>
              <option value="draft">Draft (only you can see it)</option>
              <option value="published">Published</option>
            </select>
          </label>
        </div>
        <label className="block text-sm font-medium">Summary (shown in lists and link previews)
          <textarea className={inputClass} rows={2} value={form.summary} onChange={(event) => setForm({ ...form, summary: event.target.value })} />
        </label>
        <label className="block text-sm font-medium">Tags (comma separated)
          <input className={inputClass} value={form.tags} onChange={(event) => setForm({ ...form, tags: event.target.value })} />
        </label>

        <div>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <label htmlFor="post-content" className="text-sm font-medium">Content (Markdown)</label>
            <div className="flex flex-wrap items-center gap-4">
              <ImageUploadButton onUploaded={(url, fileName) => setForm((current) => ({ ...current, content: `${current.content}${current.content && !current.content.endsWith("\n") ? "\n\n" : ""}![${fileName.replace(/\.[^.]+$/, "")}](${url})\n` }))} />
              <button type="button" aria-pressed={preview} className={linkButton} onClick={() => setPreview((value) => !value)}>{preview ? "Hide preview" : "Show preview"}</button>
            </div>
          </div>
          <div className={preview ? "mt-1 grid gap-4 lg:grid-cols-2" : "mt-1"}>
            <textarea id="post-content" className={`${inputClass} mt-0 font-mono text-sm`} rows={18} value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} />
            {preview ? (
              <div aria-label="Preview" role="region" className="prose max-w-none overflow-auto border border-ink/10 p-4 prose-headings:font-display prose-headings:text-ink prose-p:text-muted prose-a:text-accent dark:prose-invert lg:max-h-[30rem]">
                {form.content.trim() ? <MarkdownContent>{form.content}</MarkdownContent> : <p>Nothing to preview yet.</p>}
              </div>
            ) : null}
          </div>
          <p className="mt-1 text-xs text-muted">{form.content.trim() ? `${readingMinutes(form.content)} min read` : "Write something to see the reading time."}</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <button type="submit" className={primaryButton} disabled={pending}>{editingSlug ? "Save post" : form.status === "published" ? "Publish post" : "Save draft"}</button>
          {editingSlug ? <button type="button" className={linkButton} onClick={reset}>Cancel edit</button> : null}
          {status.kind === "pending" ? <p role="status" className="text-sm text-muted">Saving...</p> : null}
          {status.kind === "success" ? <p role="status" className="text-sm text-accent">{status.message}</p> : null}
          {status.kind === "server" ? <p role="alert" className="text-sm text-red-700">{status.message}</p> : null}
          {status.kind === "validation" ? <ul role="alert" className="list-disc pl-5 text-sm text-red-700">{status.errors.map((error) => <li key={error}>{error}</li>)}</ul> : null}
        </div>
      </form>
    </div>
  );
}
