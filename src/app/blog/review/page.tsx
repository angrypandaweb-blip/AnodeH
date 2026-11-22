import { Mark } from "@/components/Mark";
import {
  approveUrl,
  getBlogPostById,
  getBlogPostBySlug,
  rejectUrl,
  verifyBlogActionToken,
} from "@/lib/blog";
import { pageMeta } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = {
  ...pageMeta("/blog"),
  robots: { index: false, follow: false },
  title: "Blog draft review",
};

export default async function BlogReviewPage({
  searchParams,
}: {
  searchParams: Promise<{
    t?: string;
    error?: string;
    published?: string;
    rejected?: string;
    slug?: string;
    id?: string;
  }>;
}) {
  const params = await searchParams;

  if (params.published && params.slug) {
    const post = await getBlogPostBySlug(params.slug);
    return (
      <div className="site">
        <ReviewBar />
        <section className="legal blog-post">
          <p className="kicker">Published</p>
          <h1>{post?.title || "Post published"}</h1>
          <p className="lede" style={{ marginLeft: 0 }}>
            The post is live on the site. Open it and use Share if you want it on Facebook or elsewhere.
          </p>
          {post ? (
            <p>
              <a className="btn" href={`/blog/${post.slug}`}>
                Open published post
              </a>
            </p>
          ) : null}
        </section>
      </div>
    );
  }

  if (params.rejected) {
    const post = params.id ? await getBlogPostById(params.id) : null;
    return (
      <div className="site">
        <ReviewBar />
        <section className="legal blog-post">
          <p className="kicker">Rejected</p>
          <h1>{post?.title || "Draft rejected"}</h1>
          <p className="lede" style={{ marginLeft: 0 }}>
            This draft will not be published. Tomorrow’s cron can prepare the next day’s draft for review.
          </p>
          <p>
            <a href="/blog">Back to blog</a>
          </p>
        </section>
      </div>
    );
  }

  if (params.error) {
    return (
      <div className="site">
        <ReviewBar />
        <section className="legal blog-post">
          <p className="kicker">Review</p>
          <h1>Could not use that link</h1>
          <p className="banner warn">{params.error === "invalid" ? "The approval link is invalid or expired." : params.error}</p>
        </section>
      </div>
    );
  }

  const parsed = verifyBlogActionToken(params.t || "");
  const post = parsed ? await getBlogPostById(parsed.postId) : null;

  if (!post) {
    return (
      <div className="site">
        <ReviewBar />
        <section className="legal blog-post">
          <p className="kicker">Review</p>
          <h1>Draft not found</h1>
          <p className="lede" style={{ marginLeft: 0 }}>Open the link from the approval email.</p>
        </section>
      </div>
    );
  }

  const approve = approveUrl(post.id);
  const reject = rejectUrl(post.id);

  return (
    <div className="site">
      <ReviewBar />
      <section className="legal blog-post">
        <p className="kicker">Draft · {post.day_key} · {post.status}</p>
        <h1>{post.title}</h1>
        <p className="lede" style={{ marginLeft: 0 }}>{post.summary}</p>
        {post.status === "draft" ? (
          <div className="blog-review-actions">
            {approve ? (
              <a className="btn" href={approve}>
                Approve and publish
              </a>
            ) : null}
            {reject ? (
              <a className="btn ghost" href={reject}>
                Reject
              </a>
            ) : null}
          </div>
        ) : post.status === "published" ? (
          <p className="banner">Already published. <a href={`/blog/${post.slug}`}>Open post</a></p>
        ) : (
          <p className="banner warn">This draft was rejected.</p>
        )}
        <article className="blog-body" dangerouslySetInnerHTML={{ __html: post.body_html }} />
        {post.status === "draft" ? (
          <div className="blog-review-actions">
            {approve ? (
              <a className="btn" href={approve}>
                Approve and publish
              </a>
            ) : null}
            {reject ? (
              <a className="btn ghost" href={reject}>
                Reject
              </a>
            ) : null}
          </div>
        ) : null}
      </section>
    </div>
  );
}

function ReviewBar() {
  return (
    <header className="site-bar">
      <a className="brand" href="/">
        <Mark />
        <span className="brand-name">AnodeH</span>
      </a>
      <nav className="site-nav">
        <a href="/blog">Blog</a>
        <a href="/">Home</a>
      </nav>
    </header>
  );
}
