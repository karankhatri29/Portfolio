import type { ReactNode } from "react";

import { slugifyHeading } from "@/lib/content/blog-utils";

export function childrenText(children: ReactNode): string {
  if (typeof children === "string" || typeof children === "number") return String(children);
  if (Array.isArray(children)) return children.map(childrenText).join("");
  if (children && typeof children === "object" && "props" in children) return childrenText((children as { props: { children?: ReactNode } }).props.children);
  return "";
}

// Ids come from the same function the table of contents uses, so the two always agree.
export function HeadingWithId({ level, children }: { level: 2 | 3; children?: ReactNode }) {
  const Tag = level === 2 ? "h2" : "h3";
  return <Tag id={slugifyHeading(childrenText(children)) || undefined}>{children}</Tag>;
}
