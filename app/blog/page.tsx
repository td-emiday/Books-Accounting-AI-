import Link from "next/link";
import type { Metadata } from "next";
import { formatPostDate, getAllPosts } from "@/lib/blog";
import { Footer } from "@/components/landing-footer";
import "../landing.css";
import "./blog.css";

export const metadata: Metadata = {
  title: "Notes from Emiday — bookkeeping, tax and finance for Nigerian SMEs",
  description:
    "Plain-English writing from the Emiday team on the realities of running the books in Nigeria.",
  alternates: { canonical: "https://www.emiday.io/blog" },
};

export const dynamic = "force-static";

export default function BlogIndexPage() {
  const posts = getAllPosts();

  return (
    <div className="lp-root">
      <BlogNav />

      <main className="blog-shell">
        <header className="blog-index-head">
          <span className="lp-eyebrow">Notes</span>
          <h1 className="blog-index-title">
            Working notes on books, taxes and the realities of running a
            small business in Nigeria.
          </h1>
        </header>

        {posts.length === 0 ? (
          <p className="blog-index-empty">
            New writing is coming soon. In the meantime, sign in and try the
            product.
          </p>
        ) : (
          <ul className="blog-index-list">
            {posts.map((p) => (
              <li key={p.slug} className="blog-index-row">
                <Link href={`/blog/${p.slug}`} className="blog-index-link">
                  <div className="blog-index-meta">
                    <span>{formatPostDate(p.date)}</span>
                    <span className="blog-dot" aria-hidden>·</span>
                    <span>{p.category}</span>
                    <span className="blog-dot" aria-hidden>·</span>
                    <span>{p.readingMinutes} min read</span>
                  </div>
                  <h2 className="blog-index-post-title">{p.title}</h2>
                  <p className="blog-index-dek">{p.description}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>

      <Footer />
    </div>
  );
}

// Minimal nav for blog pages — links back to the marketing site.
// Avoids importing the floating glass nav from the landing because
// that one's hard-coded for the home page sections.
function BlogNav() {
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
