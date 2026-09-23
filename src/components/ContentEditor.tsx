"use client";

import { useState } from "react";
import type { FormEvent } from "react";

import { ImageUploadButton } from "@/components/ImageUploadButton";

import type { Highlight, HighlightKind, Project, SkillRecord } from "@/lib/content/repository";

type Status =
  | { kind: "idle" }
  | { kind: "pending" }
  | { kind: "success"; message: string }
  | { kind: "validation"; errors: string[] }
  | { kind: "server"; message: string };

type SendResult = { ok: true; data: Record<string, unknown> } | { ok: false; status: Status };

const inputClass = "mt-1 block w-full border border-ink/20 bg-paper px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-accent";
const primaryButton = "border border-accent px-4 py-2 text-sm font-semibold text-accent focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-paper disabled:opacity-50";
const linkButton = "text-sm font-semibold text-accent underline underline-offset-4 focus:outline-none focus:ring-2 focus:ring-accent";

async function send(method: string, url: string, body: unknown): Promise<SendResult> {
  try {
    const response = await fetch(url, { method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;

    if (response.ok) return { ok: true, data };
    if (response.status === 400 && Array.isArray(data.errors)) {
      return { ok: false, status: { kind: "validation", errors: data.errors.filter((error): error is string => typeof error === "string") } };
    }
    return { ok: false, status: { kind: "server", message: typeof data.error === "string" ? data.error : "Something went wrong. Please try again." } };
  } catch {
    return { ok: false, status: { kind: "server", message: "Could not reach the server. Please try again." } };
  }
}

function StatusMessage({ status }: { status: Status }) {
  if (status.kind === "idle") return null;
  if (status.kind === "pending") return <p role="status" className="text-sm text-muted">Saving...</p>;
  if (status.kind === "success") return <p role="status" className="text-sm text-accent">{status.message}</p>;
  if (status.kind === "server") return <p role="alert" className="text-sm text-red-700">{status.message}</p>;

  return (
    <ul role="alert" className="list-disc pl-5 text-sm text-red-700">
      {status.errors.map((error) => <li key={error}>{error}</li>)}
    </ul>
  );
}

const emptyProject = { slug: "", title: "", year: "", role: "", summary: "", outcomes: "", stack: "", githubUrl: "", problem: "", approach: "", result: "", liveUrl: "", videoUrl: "", images: "" };

function parseImages(text: string) {
  return splitList(text, "\n").map((line) => {
    const [url, ...alt] = line.split("|");
    return { url: url.trim(), alt: alt.join("|").trim() };
  });
}
const splitList = (value: string, separator: string) => value.split(separator).map((item) => item.trim()).filter(Boolean);

function ProjectEditor({ initialProjects }: { initialProjects: Project[] }) {
  const [projects, setProjects] = useState(initialProjects);
  const [form, setForm] = useState(emptyProject);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [confirmingSlug, setConfirmingSlug] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const pending = status.kind === "pending";

  function startEdit(project: Project) {
    setEditingSlug(project.slug);
    setConfirmingSlug(null);
    setForm({ ...project, outcomes: project.outcomes.join("\n"), stack: (project.stack ?? []).join(", "), githubUrl: project.githubUrl ?? "", problem: project.problem ?? "", approach: project.approach ?? "", result: project.result ?? "", liveUrl: project.liveUrl ?? "", videoUrl: project.videoUrl ?? "", images: (project.images ?? []).map((image) => `${image.url} | ${image.alt}`).join("\n") });
    setStatus({ kind: "idle" });
  }

  function reset() {
    setEditingSlug(null);
    setForm(emptyProject);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setStatus({ kind: "pending" });
    const payload = { ...form, outcomes: splitList(form.outcomes, "\n"), stack: splitList(form.stack, ","), images: parseImages(form.images) };
    const result = await send(editingSlug ? "PATCH" : "POST", "/api/projects", payload);
    if (!result.ok) return setStatus(result.status);

    const saved = result.data.project as Project;
    setProjects((current) => (editingSlug ? current.map((item) => (item.slug === saved.slug ? saved : item)) : [...current, saved]));
    setStatus({ kind: "success", message: editingSlug ? "Project updated." : "Project created." });
    reset();
  }

  async function remove(slug: string) {
    setConfirmingSlug(null);
    setStatus({ kind: "pending" });
    const result = await send("DELETE", "/api/projects", { slug });
    if (!result.ok) return setStatus(result.status);

    setProjects((current) => current.filter((item) => item.slug !== slug));
    if (editingSlug === slug) reset();
    setStatus({ kind: "success", message: "Project deleted." });
  }

  return (
    <section aria-labelledby="admin-projects-title" className="border-t border-ink/10 py-10">
      <h2 id="admin-projects-title" className="font-display text-2xl font-semibold">Projects</h2>
      {projects.length ? (
        <ul className="mt-6 divide-y divide-ink/10 border border-ink/10">
          {projects.map((project) => (
            <li key={project.slug} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <span><span className="font-semibold">{project.title}</span> <span className="text-sm text-muted">({project.slug})</span></span>
              <span className="flex gap-4">
                <button type="button" className={linkButton} onClick={() => startEdit(project)}>Edit {project.title}</button>
                {confirmingSlug === project.slug
                  ? <button type="button" className={linkButton} onClick={() => remove(project.slug)}>Confirm delete {project.title}</button>
                  : <button type="button" className={linkButton} onClick={() => setConfirmingSlug(project.slug)}>Delete {project.title}</button>}
              </span>
            </li>
          ))}
        </ul>
      ) : <p className="mt-6 text-muted">No projects yet.</p>}

      <form onSubmit={submit} className="mt-8 grid gap-4" aria-label={editingSlug ? "Edit project" : "New project"}>
        <h3 className="text-lg font-semibold">{editingSlug ? "Edit project" : "New project"}</h3>
        <label className="block text-sm font-medium">Slug
          <input className={inputClass} value={form.slug} disabled={editingSlug !== null} onChange={(event) => setForm({ ...form, slug: event.target.value })} />
        </label>
        <label className="block text-sm font-medium">Project title
          <input className={inputClass} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
        </label>
        <label className="block text-sm font-medium">Year
          <input className={inputClass} value={form.year} onChange={(event) => setForm({ ...form, year: event.target.value })} />
        </label>
        <label className="block text-sm font-medium">Role
          <input className={inputClass} value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })} />
        </label>
        <label className="block text-sm font-medium">Summary
          <textarea className={inputClass} rows={3} value={form.summary} onChange={(event) => setForm({ ...form, summary: event.target.value })} />
        </label>
        <label className="block text-sm font-medium">Outcomes (one per line)
          <textarea className={inputClass} rows={4} value={form.outcomes} onChange={(event) => setForm({ ...form, outcomes: event.target.value })} />
        </label>
        <label className="block text-sm font-medium">Stack (comma separated, match tool names used in Competencies)
          <input className={inputClass} value={form.stack} onChange={(event) => setForm({ ...form, stack: event.target.value })} />
        </label>
        <label className="block text-sm font-medium">GitHub repository URL
          <input className={inputClass} type="url" placeholder="https://github.com/you/repo" value={form.githubUrl} onChange={(event) => setForm({ ...form, githubUrl: event.target.value })} />
        </label>
        <fieldset className="grid gap-4 border border-ink/10 p-4">
          <legend className="px-2 text-sm font-semibold">Case study (optional)</legend>
          <label className="block text-sm font-medium">The problem
            <textarea className={inputClass} rows={3} value={form.problem} onChange={(event) => setForm({ ...form, problem: event.target.value })} />
          </label>
          <label className="block text-sm font-medium">The approach
            <textarea className={inputClass} rows={3} value={form.approach} onChange={(event) => setForm({ ...form, approach: event.target.value })} />
          </label>
          <label className="block text-sm font-medium">The result
            <textarea className={inputClass} rows={3} value={form.result} onChange={(event) => setForm({ ...form, result: event.target.value })} />
          </label>
          <label className="block text-sm font-medium">Live demo URL
            <input className={inputClass} type="url" placeholder="https://" value={form.liveUrl} onChange={(event) => setForm({ ...form, liveUrl: event.target.value })} />
          </label>
          <label className="block text-sm font-medium">Demo video URL
            <input className={inputClass} type="url" placeholder="https://" value={form.videoUrl} onChange={(event) => setForm({ ...form, videoUrl: event.target.value })} />
          </label>
          <label className="block text-sm font-medium">Screenshots (one per line: https link | short description)
            <textarea className={inputClass} rows={4} placeholder="https://.../dashboard.png | Dashboard showing the email graph" value={form.images} onChange={(event) => setForm({ ...form, images: event.target.value })} />
          </label>
          <ImageUploadButton label="Upload screenshot" onUploaded={(url) => setForm((current) => ({ ...current, images: `${current.images}${current.images && !current.images.endsWith("\n") ? "\n" : ""}${url} | ` }))} />
        </fieldset>
        <div className="flex flex-wrap items-center gap-4">
          <button type="submit" className={primaryButton} disabled={pending}>{editingSlug ? "Save project" : "Create project"}</button>
          {editingSlug ? <button type="button" className={linkButton} onClick={reset}>Cancel edit</button> : null}
          <StatusMessage status={status} />
        </div>
      </form>
    </section>
  );
}

const emptySkill = { name: "", description: "", tools: "" };

function SkillEditor({ initialSkills }: { initialSkills: SkillRecord[] }) {
  const [skills, setSkills] = useState(initialSkills);
  const [form, setForm] = useState(emptySkill);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const pending = status.kind === "pending";

  function startEdit(skill: SkillRecord) {
    setEditingId(skill.id);
    setConfirmingId(null);
    setForm({ name: skill.name, description: skill.description, tools: (skill.tools ?? []).join(", ") });
    setStatus({ kind: "idle" });
  }

  function reset() {
    setEditingId(null);
    setForm(emptySkill);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setStatus({ kind: "pending" });
    const body = { ...form, tools: splitList(form.tools, ",") };
    const result = await send(editingId ? "PATCH" : "POST", "/api/skills", editingId ? { id: editingId, ...body } : body);
    if (!result.ok) return setStatus(result.status);

    const saved = result.data.skill as SkillRecord;
    setSkills((current) => (editingId ? current.map((item) => (item.id === saved.id ? saved : item)) : [...current, saved]));
    setStatus({ kind: "success", message: editingId ? "Competency updated." : "Competency created." });
    reset();
  }

  async function remove(id: string) {
    setConfirmingId(null);
    setStatus({ kind: "pending" });
    const result = await send("DELETE", "/api/skills", { id });
    if (!result.ok) return setStatus(result.status);

    setSkills((current) => current.filter((item) => item.id !== id));
    if (editingId === id) reset();
    setStatus({ kind: "success", message: "Competency deleted." });
  }

  return (
    <section aria-labelledby="admin-skills-title" className="border-t border-ink/10 py-10">
      <h2 id="admin-skills-title" className="font-display text-2xl font-semibold">Competencies</h2>
      {skills.length ? (
        <ul className="mt-6 divide-y divide-ink/10 border border-ink/10">
          {skills.map((skill) => (
            <li key={skill.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <span className="font-semibold">{skill.name}</span>
              <span className="flex gap-4">
                <button type="button" className={linkButton} onClick={() => startEdit(skill)}>Edit {skill.name}</button>
                {confirmingId === skill.id
                  ? <button type="button" className={linkButton} onClick={() => remove(skill.id)}>Confirm delete {skill.name}</button>
                  : <button type="button" className={linkButton} onClick={() => setConfirmingId(skill.id)}>Delete {skill.name}</button>}
              </span>
            </li>
          ))}
        </ul>
      ) : <p className="mt-6 text-muted">No competencies yet.</p>}

      <form onSubmit={submit} className="mt-8 grid gap-4" aria-label={editingId ? "Edit competency" : "New competency"}>
        <h3 className="text-lg font-semibold">{editingId ? "Edit competency" : "New competency"}</h3>
        <label className="block text-sm font-medium">Competency name
          <input className={inputClass} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        </label>
        <label className="block text-sm font-medium">Description
          <textarea className={inputClass} rows={3} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
        </label>
        <label className="block text-sm font-medium">Tools (comma separated)
          <input className={inputClass} value={form.tools} onChange={(event) => setForm({ ...form, tools: event.target.value })} />
        </label>
        <div className="flex flex-wrap items-center gap-4">
          <button type="submit" className={primaryButton} disabled={pending}>{editingId ? "Save competency" : "Create competency"}</button>
          {editingId ? <button type="button" className={linkButton} onClick={reset}>Cancel edit</button> : null}
          <StatusMessage status={status} />
        </div>
      </form>
    </section>
  );
}

const emptyHighlight = { kind: "testimonial" as HighlightKind, title: "", subtitle: "", body: "", url: "" };

const highlightLabels: Record<HighlightKind, { title: string; subtitle: string; body: string }> = {
  testimonial: { title: "Person's name", subtitle: "Their role and company", body: "What they said (the quote)" },
  publication: { title: "Paper or article title", subtitle: "Venue and year", body: "Short summary (optional)" },
};

function HighlightEditor({ initialHighlights }: { initialHighlights: Highlight[] }) {
  const [items, setItems] = useState(initialHighlights);
  const [form, setForm] = useState(emptyHighlight);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const pending = status.kind === "pending";
  const labels = highlightLabels[form.kind];

  function startEdit(item: Highlight) {
    setEditingId(item.id);
    setConfirmingId(null);
    setForm({ kind: item.kind, title: item.title, subtitle: item.subtitle, body: item.body, url: item.url ?? "" });
    setStatus({ kind: "idle" });
  }

  function reset() {
    setEditingId(null);
    setForm(emptyHighlight);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setStatus({ kind: "pending" });
    const result = await send(editingId ? "PATCH" : "POST", "/api/highlights", editingId ? { id: editingId, ...form } : form);
    if (!result.ok) return setStatus(result.status);

    const saved = result.data.highlight as Highlight;
    setItems((current) => (editingId ? current.map((item) => (item.id === saved.id ? saved : item)) : [...current, saved]));
    setStatus({ kind: "success", message: editingId ? "Entry updated." : "Entry created." });
    reset();
  }

  async function remove(id: string) {
    setConfirmingId(null);
    setStatus({ kind: "pending" });
    const result = await send("DELETE", "/api/highlights", { id });
    if (!result.ok) return setStatus(result.status);

    setItems((current) => current.filter((item) => item.id !== id));
    if (editingId === id) reset();
    setStatus({ kind: "success", message: "Entry deleted." });
  }

  return (
    <section aria-labelledby="admin-highlights-title" className="border-t border-ink/10 py-10">
      <h2 id="admin-highlights-title" className="font-display text-2xl font-semibold">Testimonials and publications</h2>
      <p className="mt-2 text-sm text-muted">These sections appear on the home page only when at least one entry exists.</p>
      {items.length ? (
        <ul className="mt-6 divide-y divide-ink/10 border border-ink/10">
          {items.map((item) => (
            <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <span><span className="font-semibold">{item.title}</span> <span className="text-sm text-muted">({item.kind})</span></span>
              <span className="flex gap-4">
                <button type="button" className={linkButton} onClick={() => startEdit(item)}>Edit {item.title}</button>
                {confirmingId === item.id
                  ? <button type="button" className={linkButton} onClick={() => remove(item.id)}>Confirm delete {item.title}</button>
                  : <button type="button" className={linkButton} onClick={() => setConfirmingId(item.id)}>Delete {item.title}</button>}
              </span>
            </li>
          ))}
        </ul>
      ) : <p className="mt-6 text-muted">No entries yet.</p>}

      <form onSubmit={submit} className="mt-8 grid gap-4" aria-label={editingId ? "Edit entry" : "New entry"}>
        <h3 className="text-lg font-semibold">{editingId ? "Edit entry" : "New entry"}</h3>
        <label className="block text-sm font-medium">Type
          <select className={inputClass} value={form.kind} onChange={(event) => setForm({ ...form, kind: event.target.value as HighlightKind })}>
            <option value="testimonial">Testimonial</option>
            <option value="publication">Publication</option>
          </select>
        </label>
        <label className="block text-sm font-medium">{labels.title}
          <input className={inputClass} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
        </label>
        <label className="block text-sm font-medium">{labels.subtitle}
          <input className={inputClass} value={form.subtitle} onChange={(event) => setForm({ ...form, subtitle: event.target.value })} />
        </label>
        <label className="block text-sm font-medium">{labels.body}
          <textarea className={inputClass} rows={4} value={form.body} onChange={(event) => setForm({ ...form, body: event.target.value })} />
        </label>
        <label className="block text-sm font-medium">Link (optional)
          <input className={inputClass} type="url" placeholder="https://" value={form.url} onChange={(event) => setForm({ ...form, url: event.target.value })} />
        </label>
        <div className="flex flex-wrap items-center gap-4">
          <button type="submit" className={primaryButton} disabled={pending}>{editingId ? "Save entry" : "Create entry"}</button>
          {editingId ? <button type="button" className={linkButton} onClick={reset}>Cancel edit</button> : null}
          <StatusMessage status={status} />
        </div>
      </form>
    </section>
  );
}

export function ContentEditor({ initialProjects, initialSkills, initialHighlights = [] }: { initialProjects: Project[]; initialSkills: SkillRecord[]; initialHighlights?: Highlight[] }) {
  return (
    <div>
      <ProjectEditor initialProjects={initialProjects} />
      <SkillEditor initialSkills={initialSkills} />
      <HighlightEditor initialHighlights={initialHighlights} />
    </div>
  );
}
