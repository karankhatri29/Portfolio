import type { Metadata } from "next";

import { auth } from "@/auth";
import { AdminGate } from "@/components/AdminGate";
import { AdminShell } from "@/components/AdminShell";
import { ContentEditor } from "@/components/ContentEditor";
import { listHighlights, listProjects, listSkills } from "@/lib/content/repository";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

export default async function AdminPage() {
  const session = await auth();
  const isAdmin = session?.role === "Admin";
  const [projects, skills, highlights] = isAdmin ? await Promise.all([listProjects(), listSkills(), listHighlights()]) : [[], [], []];

  return (
    <AdminShell current="content" title="Manage content" description="The projects, competencies, testimonials and publications shown on the home page." signedIn={isAdmin}>
      <AdminGate session={session}>
        <ContentEditor initialProjects={projects} initialSkills={skills} initialHighlights={highlights} />
      </AdminGate>
    </AdminShell>
  );
}
