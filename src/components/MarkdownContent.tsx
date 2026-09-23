import "highlight.js/styles/github-dark.css";

import type { ComponentPropsWithoutRef } from "react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";

import { HeadingWithId } from "@/components/markdown-heading";

function ExternalAwareLink({ href, children }: ComponentPropsWithoutRef<"a">) {
  const external = typeof href === "string" && /^https?:\/\//.test(href);
  return <a href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>{children}</a>;
}

function SafeImage({ src, alt }: ComponentPropsWithoutRef<"img">) {
  if (typeof src !== "string" || !/^(https:\/\/|\/)/.test(src)) return null;
  // eslint-disable-next-line @next/next/no-img-element -- author-supplied images from any https host
  return <img src={src} alt={alt ?? ""} loading="lazy" decoding="async" className="mx-auto h-auto max-w-full border border-ink/10" />;
}

export function MarkdownContent({ children }: { children: string }) {
  return (
    <ReactMarkdown
      rehypePlugins={[rehypeHighlight]}
      components={{
        h2: ({ children: content }) => <HeadingWithId level={2}>{content}</HeadingWithId>,
        h3: ({ children: content }) => <HeadingWithId level={3}>{content}</HeadingWithId>,
        a: ExternalAwareLink,
        img: SafeImage,
      }}
    >
      {children}
    </ReactMarkdown>
  );
}
