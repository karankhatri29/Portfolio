import { getBlogPost } from "@/lib/content/blog";
import { OG_SIZE, OG_TYPE, renderOgImage } from "@/lib/og";

export const alt = "Blog post preview";
export const size = OG_SIZE;
export const contentType = OG_TYPE;

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getBlogPost(slug);

  return renderOgImage({ kicker: "Writing and research", title: post?.title ?? "Writing and research", subtitle: post?.summary });
}
