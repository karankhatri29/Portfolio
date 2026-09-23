"use client";

import { useState } from "react";
import type { FormEvent } from "react";

import type { Project, SkillRecord } from "@/lib/content/repository";

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

const emptyProject = { slug: "", title: "", year: "", role: "", summary: "", outcomes: "" };

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
    setForm({ ...project, outcomes: project.outcomes.join("\n") });
    setStatus({ kind: "idle" });
  }

  function reset() {
    setEditingSlug(null);
    setForm(emptyProject);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setStatus({ kind: "pending" });
    const payload = { ...form, outcomes: form.outcomes.split("\n").map((line) => line.trim()).filter(Boolean) };
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
        <div className="flex flex-wrap items-center gap-4">
          <button type="submit" className={primaryButton} disabled={pending}>{editingSlug ? "Save project" : "Create project"}</button>
          {editingSlug ? <button type="button" className={linkButton} onClick={reset}>Cancel edit</button> : null}
          <StatusMessage status={status} />
        </div>
      </form>
    </section>
  );
}

const emptySkill = { name: "", description: "" };

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
    setForm({ name: skill.name, description: skill.description });
    setStatus({ kind: "idle" });
  }

  function reset() {
    setEditingId(null);
    setForm(emptySkill);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setStatus({ kind: "pending" });
    const result = await send(editingId ? "PATCH" : "POST", "/api/skills", editingId ? { id: editingId, ...form } : form);
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
        <div className="flex flex-wrap items-center gap-4">
          <button type="submit" className={primaryButton} disabled={pending}>{editingId ? "Save competency" : "Create competency"}</button>
          {editingId ? <button type="button" className={linkButton} onClick={reset}>Cancel edit</button> : null}
          <StatusMessage status={status} />
        </div>
      </form>
    </section>
  );
}

export function ContentEditor({ initialProjects, initialSkills }: { initialProjects: Project[]; initialSkills: SkillRecord[] }) {
  return (
    <div>
      <ProjectEditor initialProjects={initialProjects} />
      <SkillEditor initialSkills={initialSkills} />
    </div>
  );
}
