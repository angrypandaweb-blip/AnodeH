import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { execute, getDb, queryAll, queryOne } from "@/lib/db";
import {
  dayKeyFromMs,
  facebookCaption,
  pickTopicForDay,
  renderBlogHtml,
  renderBlogText,
  slugForDay,
  type BlogTopic,
} from "@/lib/blog-topics";
import { SUPPORT_EMAIL } from "@/lib/email-reports";
import { escapeHtml, mailConfigured, sendMail } from "@/lib/mail";
import { facebookConfigured, postToFacebookPage } from "@/lib/facebook";
import { SITE } from "@/lib/seo";

export type BlogStatus = "draft" | "published" | "rejected";

export type BlogPost = {
  id: string;
  day_key: string;
  slug: string;
  topic_id: string;
  title: string;
  description: string;
  summary: string;
  body_html: string;
  body_text: string;
  status: BlogStatus;
  created_at: number;
  emailed_at: number;
  published_at: number;
  rejected_at: number;
  facebook_post_id: string;
  facebook_error: string;
};

const BLOG_TZ = "Africa/Johannesburg";

export function blogApprovalEmail() {
  const configured = (process.env.BLOG_APPROVAL_EMAIL || "").trim();
  if (configured && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(configured)) return configured;
  return SUPPORT_EMAIL;
}

function approvalSecret() {
  return process.env.BLOG_APPROVAL_SECRET || process.env.CRON_SECRET || "";
}

export function signBlogAction(postId: string, action: "approve" | "reject") {
  const secret = approvalSecret();
  if (!secret) return "";
  const sig = createHmac("sha256", secret).update(`${action}:${postId}`).digest("hex");
  return `${action}.${postId}.${sig}`;
}

export function verifyBlogActionToken(token: string): { postId: string; action: "approve" | "reject" } | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [action, postId, sig] = parts;
  if ((action !== "approve" && action !== "reject") || !postId || !sig) return null;
  const secret = approvalSecret();
  if (!secret) return null;
  const expected = createHmac("sha256", secret).update(`${action}:${postId}`).digest("hex");
  try {
    const a = Buffer.from(sig, "utf8");
    const b = Buffer.from(expected, "utf8");
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }
  return { postId, action };
}

export function reviewUrl(postId: string) {
  const token = signBlogAction(postId, "approve");
  return token ? `${SITE}/blog/review?t=${encodeURIComponent(token)}` : `${SITE}/blog`;
}

export function approveUrl(postId: string) {
  const token = signBlogAction(postId, "approve");
  return token ? `${SITE}/api/blog/decide?t=${encodeURIComponent(token)}` : "";
}

export function rejectUrl(postId: string) {
  const token = signBlogAction(postId, "reject");
  return token ? `${SITE}/api/blog/decide?t=${encodeURIComponent(token)}` : "";
}

export async function getBlogPostBySlug(slug: string) {
  return queryOne<BlogPost>(await getDb(), "SELECT * FROM blog_posts WHERE slug = ?", [slug]);
}

export async function getBlogPostById(id: string) {
  return queryOne<BlogPost>(await getDb(), "SELECT * FROM blog_posts WHERE id = ?", [id]);
}

export async function listPublishedPosts(limit = 60) {
  return queryAll<BlogPost>(
    await getDb(),
    "SELECT * FROM blog_posts WHERE status = 'published' ORDER BY published_at DESC, created_at DESC LIMIT ?",
    [limit],
  );
}

export async function getPostForDay(dayKey: string) {
  return queryOne<BlogPost>(await getDb(), "SELECT * FROM blog_posts WHERE day_key = ?", [dayKey]);
}

function buildDraft(topic: BlogTopic, dayKey: string): Omit<BlogPost, "emailed_at" | "published_at" | "rejected_at" | "facebook_post_id" | "facebook_error"> & {
  emailed_at: number;
  published_at: number;
  rejected_at: number;
  facebook_post_id: string;
  facebook_error: string;
} {
  const now = Math.floor(Date.now() / 1000);
  return {
    id: `blog_${randomBytes(8).toString("hex")}`,
    day_key: dayKey,
    slug: slugForDay(dayKey, topic),
    topic_id: topic.id,
    title: topic.title,
    description: topic.description,
    summary: topic.summary,
    body_html: renderBlogHtml(topic, dayKey),
    body_text: renderBlogText(topic, dayKey),
    status: "draft",
    created_at: now,
    emailed_at: 0,
    published_at: 0,
    rejected_at: 0,
    facebook_post_id: "",
    facebook_error: "",
  };
}

export function draftApprovalLetter(post: BlogPost) {
  const read = reviewUrl(post.id);
  const approve = approveUrl(post.id);
  const reject = rejectUrl(post.id);
  const subject = `Approve AnodeH blog draft: ${post.title}`;
  const text = [
    "A daily AnodeH blog draft is ready for your review.",
    "",
    `Title: ${post.title}`,
    `Day: ${post.day_key}`,
    `Slug: ${post.slug}`,
    "",
    post.body_text,
    "",
    `Read on the site: ${read}`,
    approve ? `Approve and publish (also posts to Facebook when configured): ${approve}` : "Approve link unavailable — set CRON_SECRET or BLOG_APPROVAL_SECRET.",
    reject ? `Reject: ${reject}` : "",
    "",
    "Nothing is public until you approve.",
    "",
    "AnodeH",
  ]
    .filter(Boolean)
    .join("\n");

  const html = `<p>A daily AnodeH blog draft is ready for your review.</p>
<p><strong>${escapeHtml(post.title)}</strong><br>
Day: ${escapeHtml(post.day_key)} · Slug: <code>${escapeHtml(post.slug)}</code></p>
<hr />
${post.body_html}
<hr />
<p><a href="${escapeHtml(read)}">Read on the site</a></p>
<p>${
    approve
      ? `<a href="${escapeHtml(approve)}"><strong>Approve and publish</strong></a> (also posts to the AnodeH Facebook page when configured)`
      : "Approve link unavailable — set CRON_SECRET or BLOG_APPROVAL_SECRET."
  }</p>
${reject ? `<p><a href="${escapeHtml(reject)}">Reject this draft</a></p>` : ""}
<p>Nothing is public until you approve.</p>
<p>AnodeH</p>`;

  return { subject, text, html, to: blogApprovalEmail() };
}

/** Create today's draft (if missing) and email it for approval. Does not publish. */
export async function prepareDailyBlogDraft(now = Date.now()) {
  const dayKey = dayKeyFromMs(now, BLOG_TZ);
  const existing = await getPostForDay(dayKey);
  if (existing?.status === "published") {
    return { ok: true as const, dayKey, post: existing, emailed: false, reason: "already_published" as const };
  }
  if (existing?.status === "rejected") {
    return { ok: true as const, dayKey, post: existing, emailed: false, reason: "already_rejected" as const };
  }

  let post = existing;
  if (!post) {
    const topic = pickTopicForDay(dayKey);
    const draft = buildDraft(topic, dayKey);
    await execute(
      await getDb(),
      `INSERT INTO blog_posts (
        id, day_key, slug, topic_id, title, description, summary, body_html, body_text,
        status, created_at, emailed_at, published_at, rejected_at, facebook_post_id, facebook_error
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        draft.id,
        draft.day_key,
        draft.slug,
        draft.topic_id,
        draft.title,
        draft.description,
        draft.summary,
        draft.body_html,
        draft.body_text,
        draft.status,
        draft.created_at,
        draft.emailed_at,
        draft.published_at,
        draft.rejected_at,
        draft.facebook_post_id,
        draft.facebook_error,
      ],
    );
    post = draft;
  }

  if (post.emailed_at > 0) {
    return { ok: true as const, dayKey, post, emailed: false, reason: "already_emailed" as const };
  }

  if (!mailConfigured()) {
    return {
      ok: false as const,
      dayKey,
      post,
      emailed: false,
      reason: "mail_not_configured" as const,
      error: "Add RESEND_API_KEY and MAIL_FROM, then redeploy.",
    };
  }

  if (!approvalSecret()) {
    return {
      ok: false as const,
      dayKey,
      post,
      emailed: false,
      reason: "approval_secret_missing" as const,
      error: "Add CRON_SECRET or BLOG_APPROVAL_SECRET, then redeploy.",
    };
  }

  const letter = draftApprovalLetter(post);
  const sent = await sendMail(letter.to, letter.subject, letter.text, letter.html);
  if (!sent.ok) {
    return { ok: false as const, dayKey, post, emailed: false, reason: "mail_failed" as const, error: sent.error };
  }

  const emailedAt = Math.floor(Date.now() / 1000);
  await execute(await getDb(), "UPDATE blog_posts SET emailed_at = ? WHERE id = ?", [emailedAt, post.id]);
  return {
    ok: true as const,
    dayKey,
    post: { ...post, emailed_at: emailedAt },
    emailed: true,
    reason: "emailed" as const,
    to: letter.to,
  };
}

export async function rejectBlogPost(postId: string) {
  const post = await getBlogPostById(postId);
  if (!post) return { ok: false as const, error: "Draft not found." };
  if (post.status === "published") return { ok: false as const, error: "This post is already published." };
  if (post.status === "rejected") return { ok: true as const, post, already: true as const };

  const rejectedAt = Math.floor(Date.now() / 1000);
  await execute(await getDb(), "UPDATE blog_posts SET status = 'rejected', rejected_at = ? WHERE id = ?", [
    rejectedAt,
    postId,
  ]);
  return { ok: true as const, post: { ...post, status: "rejected" as const, rejected_at: rejectedAt }, already: false as const };
}

export async function publishBlogPost(postId: string) {
  const post = await getBlogPostById(postId);
  if (!post) return { ok: false as const, error: "Draft not found." };
  if (post.status === "rejected") return { ok: false as const, error: "This draft was rejected." };

  const url = `${SITE}/blog/${post.slug}`;
  const publishedAt = post.published_at || Math.floor(Date.now() / 1000);

  if (post.status !== "published") {
    await execute(await getDb(), "UPDATE blog_posts SET status = 'published', published_at = ? WHERE id = ?", [
      publishedAt,
      postId,
    ]);
  }

  let facebookPostId = post.facebook_post_id;
  let facebookError = post.facebook_error;
  let facebookSkipped = false;
  let facebookSkipReason = "";

  if (!facebookPostId) {
    const fb = await postToFacebookPage({
      message: facebookCaption(
        {
          id: post.topic_id,
          title: post.title,
          description: post.description,
          summary: post.summary,
          sections: [],
        },
        url,
      ),
      link: url,
    });

    if (fb.ok && fb.skipped) {
      facebookSkipped = true;
      facebookSkipReason = fb.reason;
      facebookError = fb.reason;
    } else if (fb.ok) {
      facebookPostId = fb.id;
      facebookError = "";
    } else {
      facebookError = fb.error;
    }

    await execute(await getDb(), "UPDATE blog_posts SET facebook_post_id = ?, facebook_error = ? WHERE id = ?", [
      facebookPostId,
      facebookError,
      postId,
    ]);
  }

  const updated: BlogPost = {
    ...post,
    status: "published",
    published_at: publishedAt,
    facebook_post_id: facebookPostId,
    facebook_error: facebookError,
  };

  return {
    ok: true as const,
    post: updated,
    url,
    facebook: {
      configured: facebookConfigured(),
      postId: facebookPostId,
      error: facebookError,
      skipped: facebookSkipped,
      skipReason: facebookSkipReason,
    },
  };
}
