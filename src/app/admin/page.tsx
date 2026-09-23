import Link from "next/link";

import { auth } from "@/auth";
import { AdminGate } from "@/components/AdminGate";
import { ContentEditor } from "@/components/ContentEditor";
import { listProjects, listSkills } from "@/lib/content/repository";

export default async function AdminPage() {
  const session = await auth();
  const isAdmin = session?.role === "Admin";
  const [projects, skills] = isAdmin ? await Promise.all([listProjects(), listSkills()]) : [[], []];

  return (
    <main className="mx-auto max-w-4xl px-5 py-20 lg:px-8 lg:py-32">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">Admin</p>
      <h1 className="mt-4 font-display text-5xl font-semibold tracking-tight sm:text-7xl">Manage content</h1>
      {isAdmin ? <p className="mt-6"><Link href="/admin/analytics" className="text-sm font-semibold text-accent underline underline-offset-4">View analytics</Link></p> : null}
      <div className="mt-14">
        <AdminGate session={session}>
          <ContentEditor initialProjects={projects} initialSkills={skills} />
        </AdminGate>
      </div>
    </main>
  );
}
