import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogShare } from "@/components/BlogShare";
import { Mark } from "@/components/Mark";
import { getUser } from "@/lib/auth";
import { getBlogPostBySlug } from "@/lib/blog";
import { SITE } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post || post.status !== "published") return { robots: { index: false, follow: false } };
  const titled = `${post.title} · AnodeH`;
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title: titled,
      description: post.description,
      url: `/blog/${post.slug}`,
      type: "article",
    },
    twitter: {
      title: titled,
      description: post.description,
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [user, post] = await Promise.all([getUser(), getBlogPostBySlug(slug)]);
  if (!post || post.status !== "published") notFound();

  const published = post.published_at
    ? new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date(post.published_at * 1000))
    : post.day_key;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: new Date(post.published_at * 1000).toISOString(),
    author: { "@type": "Organization", name: "AnodeH", url: SITE },
    publisher: { "@type": "Organization", name: "AnodeH", url: SITE },
    mainEntityOfPage: `${SITE}/blog/${post.slug}`,
    url: `${SITE}/blog/${post.slug}`,
  };

  return (
    <div className="site">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
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

      <article className="legal blog-post">
        <p className="kicker">
          <a href="/blog">Blog</a> · {published}
        </p>
        <h1>{post.title}</h1>
        <p className="lede" style={{ marginLeft: 0 }}>{post.summary}</p>
        <BlogShare url={`${SITE}/blog/${post.slug}`} title={post.title} />
        <div className="blog-body" dangerouslySetInnerHTML={{ __html: post.body_html }} />
        <BlogShare url={`${SITE}/blog/${post.slug}`} title={post.title} />
      </article>

      <footer className="site-legal">
        <a href="/blog">All posts</a>
        <a href="/register">Create an account</a>
        <a href="/support">Support</a>
      </footer>
    </div>
  );
}
