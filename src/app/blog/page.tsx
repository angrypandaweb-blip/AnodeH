import { Mark } from "@/components/Mark";
import { getUser } from "@/lib/auth";
import { listPublishedPosts } from "@/lib/blog";
import { pageMeta } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = pageMeta("/blog");

export default async function BlogIndexPage() {
  const [user, posts] = await Promise.all([getUser(), listPublishedPosts()]);

  return (
    <div className="site">
      <header className="site-bar">
        <a className="brand" href="/">
          <Mark />
          <span className="brand-name">AnodeH</span>
        </a>
        <nav className="site-nav">
          <a href="/">Home</a>
          <a href="/blog">Blog</a>
          <a href={user ? "/dashboard" : "/login"}>{user ? "Account" : "Log in"}</a>
        </nav>
      </header>

      <section className="hero" style={{ textAlign: "left", maxWidth: 720 }}>
        <p className="kicker">Blog</p>
        <h1>How AnodeH protects domains</h1>
        <p className="lede" style={{ marginLeft: 0 }}>
          Short posts about invalid click patterns, IP exclusions, Performance Max, and spam email monitoring.
        </p>
      </section>

      <section className="legal blog-index">
        {posts.length === 0 ? (
          <p className="note">No published posts yet. Drafts are emailed for approval before they go live.</p>
        ) : (
          <ul className="blog-list">
            {posts.map((post) => (
              <li key={post.id}>
                <a href={`/blog/${post.slug}`}>
                  <strong>{post.title}</strong>
                  <span>{post.summary}</span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>

      <footer className="site-legal">
        <a href="/privacy">Privacy</a>
        <a href="/terms">Terms</a>
        <a href="/support">Support</a>
        <a href="/blog">Blog</a>
      </footer>
    </div>
  );
}
