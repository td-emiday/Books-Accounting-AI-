// Blog post loader. Posts live as markdown files in `content/blog/`
// with YAML frontmatter. Read at build time (server-only) — no
// database, no CMS. To publish: write a .md file, commit, deploy.
//
// Frontmatter schema (required unless noted):
//   title:        string
//   description:  string                — used as the dek + meta description
//   date:         "YYYY-MM-DD"          — publish date
//   author:       string
//   category:     string                — e.g. "Tax", "Bookkeeping", "Product"
//   draft:        boolean (optional)    — true = exclude from index + 404 the URL
//   ogImage:      string  (optional)    — /public path used in <meta og:image>

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { remark } from "remark";
import remarkHtml from "remark-html";
import remarkGfm from "remark-gfm";
import readingTimeOf from "reading-time";

const POSTS_DIR = path.join(process.cwd(), "content", "blog");

export type PostFrontmatter = {
  title: string;
  description: string;
  date: string;        // ISO YYYY-MM-DD
  author: string;
  category: string;
  draft?: boolean;
  ogImage?: string;
};

export type PostSummary = PostFrontmatter & {
  slug: string;
  readingMinutes: number;
};

export type Post = PostSummary & {
  /** Markdown rendered to HTML. Safe to render with dangerouslySetInnerHTML
   *  because the source is repo-controlled — no user input is parsed here. */
  html: string;
};

function readDir(): string[] {
  if (!fs.existsSync(POSTS_DIR)) return [];
  return fs
    .readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(/\.md$/, ""));
}

function readMatter(slug: string): {
  fm: PostFrontmatter;
  body: string;
} | null {
  const file = path.join(POSTS_DIR, `${slug}.md`);
  if (!fs.existsSync(file)) return null;
  const raw = fs.readFileSync(file, "utf8");
  const parsed = matter(raw);
  const fm = parsed.data as Partial<PostFrontmatter>;
  // Guard: every post must have title + date or it's malformed and we
  // skip it rather than render a half-broken page.
  if (!fm.title || !fm.date) return null;
  return {
    fm: {
      title: fm.title,
      description: fm.description ?? "",
      date: fm.date,
      author: fm.author ?? "Emiday",
      category: fm.category ?? "Notes",
      draft: fm.draft === true,
      ogImage: fm.ogImage,
    },
    body: parsed.content,
  };
}

/** Index list, newest first, drafts excluded. */
export function getAllPosts(): PostSummary[] {
  const summaries: PostSummary[] = [];
  for (const slug of readDir()) {
    const m = readMatter(slug);
    if (!m || m.fm.draft) continue;
    summaries.push({
      ...m.fm,
      slug,
      readingMinutes: Math.max(1, Math.round(readingTimeOf(m.body).minutes)),
    });
  }
  return summaries.sort((a, b) => (a.date < b.date ? 1 : -1));
}

/** Single post (used by /blog/[slug]) — returns null when missing or draft. */
export async function getPostBySlug(slug: string): Promise<Post | null> {
  const m = readMatter(slug);
  if (!m || m.fm.draft) return null;
  const processed = await remark()
    .use(remarkGfm)
    .use(remarkHtml, { sanitize: false })
    .process(m.body);
  return {
    ...m.fm,
    slug,
    readingMinutes: Math.max(1, Math.round(readingTimeOf(m.body).minutes)),
    html: String(processed),
  };
}

/** Used by generateStaticParams in the [slug] route. */
export function getAllPostSlugs(): string[] {
  return getAllPosts().map((p) => p.slug);
}

/** "12 May 2026" — keep it short and locale-aware. */
export function formatPostDate(iso: string): string {
  const d = new Date(iso + "T00:00:00Z");
  return d.toLocaleDateString("en-NG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
