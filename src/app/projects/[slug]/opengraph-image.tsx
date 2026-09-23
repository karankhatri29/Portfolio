import { getProject } from "@/lib/content/repository";
import { OG_SIZE, OG_TYPE, renderOgImage } from "@/lib/og";

export const alt = "Project preview";
export const size = OG_SIZE;
export const contentType = OG_TYPE;

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await getProject(slug).catch(() => undefined);

  return renderOgImage({ kicker: project ? `Project / ${project.role}` : "Project", title: project?.title ?? "Project", subtitle: project?.summary });
}
