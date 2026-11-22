import { Mark } from "@/components/Mark";
import { getUser } from "@/lib/auth";
import { listPublishedPosts } from "@/lib/blog";
import { mediaForPost } from "@/lib/blog-media";
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
            {posts.map((post) => {
              const media = mediaForPost(post);
              return (
                <li key={post.id}>
                  <a href={`/blog/${post.slug}`} className="blog-card-link">
                    <img src={media.image} alt={media.imageAlt} width={640} height={360} />
                    <strong>{post.title}</strong>
                    <span>{post.summary}</span>
                    <span className="blog-tags">
                      {media.tags.slice(0, 4).map((tag) => (
                        <span className="blog-tag" key={tag}>
                          {tag}
                        </span>
                      ))}
                    </span>
                  </a>
                </li>
              );
            })}
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
