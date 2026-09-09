import fs from "node:fs";
import path from "node:path";

import matter from "gray-matter";

export type BlogPost = {
  slug: string;
  title: string;
  date: string;
  summary: string;
  content: string;
};

const blogDirectory = path.join(process.cwd(), "src", "content", "blog");
const safeSlug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function parsePost(fileName: string): BlogPost {
  const slug = fileName.replace(/\.md$/, "");
  const source = fs.readFileSync(path.join(blogDirectory, fileName), "utf8");
  const parsed = matter(source);

  return {
    slug,
    title: typeof parsed.data.title === "string" ? parsed.data.title : slug,
    date: typeof parsed.data.date === "string" ? parsed.data.date : "",
    summary: typeof parsed.data.summary === "string" ? parsed.data.summary : "",
    content: parsed.content.trim(),
  };
}

export function listBlogPosts(): Omit<BlogPost, "content">[] {
  return fs.readdirSync(blogDirectory)
    .filter((fileName) => fileName.endsWith(".md") && safeSlug.test(fileName.replace(/\.md$/, "")))
    .map(parsePost)
    .map(({ content: _content, ...post }) => post)
    .sort((left, right) => right.date.localeCompare(left.date));
}

export function getBlogPost(slug: string): BlogPost | undefined {
  if (!safeSlug.test(slug)) return undefined;
  const fileName = `${slug}.md`;
  if (!fs.existsSync(path.join(blogDirectory, fileName))) return undefined;
  return parsePost(fileName);
}
