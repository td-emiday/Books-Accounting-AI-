import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  formatPostDate,
  getAllPostSlugs,
  getAllPosts,
  getPostBySlug,
} from "@/lib/blog";
import { Footer } from "@/components/landing-footer";
import "../../landing.css";
import "../blog.css";

export const dynamic = "force-static";
export const dynamicParams = false;

export async function generateStaticParams() {
  return getAllPostSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return {};
  return {
    title: `${post.title} — Emiday`,
    description: post.description,
    alternates: { canonical: `https://www.emiday.io/blog/${slug}` },
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.date,
      authors: [post.author],
      images: post.ogImage ? [{ url: post.ogImage }] : undefined,
    },
  };
}

export default async function BlogPostPage(
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  // Pick up to two suggested reads — newest other posts.
  const others = getAllPosts()
    .filter((p) => p.slug !== slug)
    .slice(0, 2);

  return (
    <div className="lp-root">
      <PostNav />

      <main className="blog-post-shell">
        <article className="blog-post">
          <Link href="/blog" className="blog-post-back">
            ← Notes
          </Link>

          <header className="blog-post-head">
            <div className="blog-post-meta">
              <span>{post.category}</span>
              <span className="blog-dot" aria-hidden>·</span>
              <span>{formatPostDate(post.date)}</span>
              <span className="blog-dot" aria-hidden>·</span>
              <span>{post.readingMinutes} min read</span>
            </div>
            <h1 className="blog-post-title">{post.title}</h1>
            {post.description ? (
              <p className="blog-post-dek">{post.description}</p>
            ) : null}
            <div className="blog-post-author">By {post.author}</div>
          </header>

          {/* The HTML is generated from a repo-controlled markdown file
              (no user input), so dangerouslySetInnerHTML is safe here. */}
          <div
            className="blog-prose"
            dangerouslySetInnerHTML={{ __html: post.html }}
          />

          {others.length > 0 && (
            <aside className="blog-post-related">
              <h2>Keep reading</h2>
              <ul>
                {others.map((p) => (
                  <li key={p.slug}>
                    <Link href={`/blog/${p.slug}`}>
                      <span className="blog-related-cat">{p.category}</span>
                      <span className="blog-related-title">{p.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </aside>
          )}
        </article>
      </main>

      <Footer />
    </div>
  );
}

function PostNav() {
  return (
    <header className="blog-nav">
      <div className="blog-nav-inner">
        <Link href="/" className="blog-nav-brand">
          emiday
        </Link>
        <nav className="blog-nav-links">
          <Link href="/#how">How it works</Link>
          <Link href="/#pricing">Pricing</Link>
          <Link href="/blog" aria-current="page">Blog</Link>
          <Link href="/sign-in" className="blog-nav-login">Log in</Link>
          <Link href="/sign-up" className="blog-nav-cta">Get started</Link>
        </nav>
      </div>
    </header>
  );
}
