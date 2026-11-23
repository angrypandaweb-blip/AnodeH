import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { execute, getDb, queryAll, queryOne } from "@/lib/db";
import {
  extractHeroImage,
  mediaForTopic,
  mediaForTopicUnique,
  pickUniqueImage,
  preferredNewsImage,
  RECENT_UNIQUE_IMAGE_WINDOW,
  replaceHeroImage,
} from "@/lib/blog-media";
import {
  findRelevantBlogNews,
  newsHashtags,
  newsSlugPart,
  newsTopicId,
  renderNewsBlogHtml,
  renderNewsBlogText,
  type BlogNewsItem,
} from "@/lib/blog-news";
import {
  BLOG_TOPICS,
  dayKeyFromMs,
  dayKeyOffset,
  pickTopicForDay,
  renderBlogHtml,
  renderBlogText,
  slugForDay,
  type BlogTopic,
} from "@/lib/blog-topics";
import { whatsappStatusEmailBlock } from "@/lib/blog-whatsapp";
import { SUPPORT_EMAIL } from "@/lib/email-reports";
import { notifyPublishedUrls } from "@/lib/indexing";
import { escapeHtml, mailConfigured, sendMail } from "@/lib/mail";
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
  source_url: string;
};

export const BLOG_TZ = "Africa/Johannesburg";
export const BLOG_DELIVERY_HOUR = 7;

export function localHourInZone(now: number, timeZone: string) {
  const hour = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    hourCycle: "h23",
  }).format(new Date(now));
  return Number(hour);
}

export function isBlogDeliveryWindow(now = Date.now()) {
  return localHourInZone(now, BLOG_TZ) === BLOG_DELIVERY_HOUR;
}

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

type DraftFields = Omit<BlogPost, "emailed_at" | "published_at" | "rejected_at" | "facebook_post_id" | "facebook_error"> & {
  emailed_at: number;
  published_at: number;
  rejected_at: number;
  facebook_post_id: string;
  facebook_error: string;
};

async function usedHeroImages(opts?: { excludePostId?: string; recentLimit?: number }) {
  const limit = opts?.recentLimit;
  const rows = limit
    ? await queryAll<{ id: string; body_html: string }>(
        await getDb(),
        `SELECT id, body_html FROM blog_posts
         WHERE status != 'rejected'
         ORDER BY COALESCE(NULLIF(published_at, 0), created_at) DESC, created_at DESC
         LIMIT ?`,
        [limit],
      )
    : await queryAll<{ id: string; body_html: string }>(
        await getDb(),
        `SELECT id, body_html FROM blog_posts WHERE status != 'rejected'`,
      );

  const used = new Set<string>();
  for (const row of rows) {
    if (opts?.excludePostId && row.id === opts.excludePostId) continue;
    const image = extractHeroImage(row.body_html);
    if (image) used.add(image);
  }
  return used;
}

/** Images that must stay unique across the most recent posts (default last 5). */
async function blockedImagesForNewDraft(excludePostId?: string) {
  const recent = await usedHeroImages({
    excludePostId,
    recentLimit: RECENT_UNIQUE_IMAGE_WINDOW,
  });
  const all = await usedHeroImages({ excludePostId });
  // Prefer avoiding every prior image; always hard-block the recent window.
  return { recent, all };
}

function buildDraft(topic: BlogTopic, dayKey: string, usedImages: Iterable<string>): DraftFields {
  const now = Math.floor(Date.now() / 1000);
  const media = mediaForTopicUnique(topic.id, usedImages);
  return {
    id: `blog_${randomBytes(8).toString("hex")}`,
    day_key: dayKey,
    slug: slugForDay(dayKey, topic),
    topic_id: topic.id,
    title: topic.title,
    description: topic.description,
    summary: topic.summary,
    body_html: renderBlogHtml(topic, dayKey, {
      imageUrl: media.image,
      imageAlt: media.imageAlt,
      tags: media.tags,
    }),
    body_text: renderBlogText(topic, dayKey, { tags: media.tags }),
    status: "draft",
    created_at: now,
    emailed_at: 0,
    published_at: 0,
    rejected_at: 0,
    facebook_post_id: "",
    facebook_error: "",
    source_url: "",
  };
}

function buildNewsDraft(item: BlogNewsItem, dayKey: string, usedImages: Iterable<string>): DraftFields {
  const now = Math.floor(Date.now() / 1000);
  const tags = newsHashtags(item);
  const preferred = preferredNewsImage(item.title, item.summary);
  const image = pickUniqueImage(preferred, usedImages);
  const title = `${item.title.replace(/\s+/g, " ").trim()} — what it means for click protection`;
  const description = `AnodeH take on ${item.source}: ${item.title}`.slice(0, 155);
  const summary = item.summary
    ? `News from ${item.source}: ${item.summary}`.slice(0, 220)
    : `News from ${item.source} about traffic quality and domain protection.`;
  return {
    id: `blog_${randomBytes(8).toString("hex")}`,
    day_key: dayKey,
    slug: `${dayKey}-${newsSlugPart(item)}`,
    topic_id: newsTopicId(item),
    title: title.slice(0, 120),
    description,
    summary,
    body_html: renderNewsBlogHtml(item, dayKey, {
      imageUrl: image.image,
      imageAlt: image.imageAlt,
      tags,
    }),
    body_text: renderNewsBlogText(item, dayKey, tags),
    status: "draft",
    created_at: now,
    emailed_at: 0,
    published_at: 0,
    rejected_at: 0,
    facebook_post_id: "",
    facebook_error: "",
    source_url: item.url,
  };
}

async function usedNewsUrls() {
  const rows = await queryAll<{ source_url: string }>(
    await getDb(),
    "SELECT source_url FROM blog_posts WHERE source_url != ''",
  );
  return new Set(rows.map((row) => row.source_url));
}

async function composeDailyDraft(dayKey: string, excludePostId?: string): Promise<DraftFields> {
  const blocked = await blockedImagesForNewDraft(excludePostId);
  const used = new Set([...blocked.recent, ...blocked.all]);
  try {
    const news = await findRelevantBlogNews({ usedUrls: await usedNewsUrls() });
    if (news) return buildNewsDraft(news, dayKey, used);
  } catch (error) {
    console.error("Blog news watch failed; falling back to topic bank.", error);
  }
  return buildDraft(pickTopicForDay(dayKey), dayKey, used);
}

async function insertDraft(draft: DraftFields) {
  await execute(
    await getDb(),
    `INSERT INTO blog_posts (
      id, day_key, slug, topic_id, title, description, summary, body_html, body_text,
      status, created_at, emailed_at, published_at, rejected_at, facebook_post_id, facebook_error, source_url
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
      draft.source_url,
    ],
  );
}

async function refreshDraft(postId: string, draft: DraftFields) {
  await execute(
    await getDb(),
    `UPDATE blog_posts
     SET title = ?, description = ?, summary = ?, body_html = ?, body_text = ?, topic_id = ?, slug = ?, source_url = ?, emailed_at = 0
     WHERE id = ?`,
    [
      draft.title,
      draft.description,
      draft.summary,
      draft.body_html,
      draft.body_text,
      draft.topic_id,
      draft.slug,
      draft.source_url,
      postId,
    ],
  );
}

export function draftApprovalLetter(post: BlogPost) {
  const read = reviewUrl(post.id);
  const approve = approveUrl(post.id);
  const reject = rejectUrl(post.id);
  const media = mediaForTopic(post.topic_id);
  const status = whatsappStatusEmailBlock(post);
  const subject = `Approve AnodeH blog draft: ${post.title}`;
  const bodyHtml = post.body_html.replaceAll('src="/blog/', `src="${SITE}/blog/`);
  const text = [
    "A daily AnodeH blog draft is ready for your review.",
    "",
    `Title: ${post.title}`,
    `Day: ${post.day_key}`,
    `Slug: ${post.slug}`,
    `Tags: ${media.tags.join(" ")}`,
    "",
    post.body_text,
    "",
    `Read on the site: ${read}`,
    approve ? `Approve and publish: ${approve}` : "Approve link unavailable — set CRON_SECRET or BLOG_APPROVAL_SECRET.",
    reject ? `Reject: ${reject}` : "",
    "",
    status.text,
    "",
    "Nothing is public until you approve. After it is live, the review page and the post share buttons include this WhatsApp Status pack (and Facebook).",
    "",
    "AnodeH",
  ]
    .filter(Boolean)
    .join("\n");

  const html = `<p>A daily AnodeH blog draft is ready for your review.</p>
<p><strong>${escapeHtml(post.title)}</strong><br>
Day: ${escapeHtml(post.day_key)} · Slug: <code>${escapeHtml(post.slug)}</code><br>
Tags: ${escapeHtml(media.tags.join(" "))}</p>
<hr />
${bodyHtml}
<hr />
${status.html}
<p><a href="${escapeHtml(read)}">Read on the site</a></p>
<p>${
    approve
      ? `<a href="${escapeHtml(approve)}"><strong>Approve and publish</strong></a>`
      : "Approve link unavailable — set CRON_SECRET or BLOG_APPROVAL_SECRET."
  }</p>
${reject ? `<p><a href="${escapeHtml(reject)}">Reject this draft</a></p>` : ""}
<p>Nothing is public until you approve. After it is live, the review page and the post share buttons include this WhatsApp Status pack (and Facebook).</p>
<p>AnodeH</p>`;

  return { subject, text, html, to: blogApprovalEmail(), whatsappStatus: status.pack };
}

async function usedTopicIds() {
  const rows = await queryAll<{ topic_id: string }>(await getDb(), "SELECT topic_id FROM blog_posts");
  return new Set(rows.map((row) => row.topic_id));
}

function pickUnusedTopic(used: Set<string>, seed: number): BlogTopic {
  for (let offset = 0; offset < BLOG_TOPICS.length; offset++) {
    const topic = BLOG_TOPICS[(seed + offset) % BLOG_TOPICS.length]!;
    if (!used.has(topic.id) && !used.has(`news-${topic.id}`)) return topic;
  }
  return pickTopicForDay(dayKeyOffset(seed));
}

async function emailDraft(post: BlogPost, toOverride?: string) {
  if (!mailConfigured()) {
    return { ok: false as const, error: "Add RESEND_API_KEY and MAIL_FROM, then redeploy.", reason: "mail_not_configured" as const };
  }
  if (!approvalSecret()) {
    return {
      ok: false as const,
      error: "Add CRON_SECRET or BLOG_APPROVAL_SECRET, then redeploy.",
      reason: "approval_secret_missing" as const,
    };
  }
  const letter = draftApprovalLetter(post);
  const to =
    toOverride && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(toOverride) ? toOverride.trim() : letter.to;
  const sent = await sendMail(to, letter.subject, letter.text, letter.html);
  if (!sent.ok) return { ok: false as const, error: sent.error, reason: "mail_failed" as const, to };
  const emailedAt = Math.floor(Date.now() / 1000);
  await execute(await getDb(), "UPDATE blog_posts SET emailed_at = ? WHERE id = ?", [emailedAt, post.id]);
  return { ok: true as const, emailedAt, to, reason: "emailed" as const };
}

/** Create N extra drafts on upcoming day keys and email each for approval. */
export async function prepareExtraBlogDrafts(count: number, now = Date.now(), opts?: { to?: string }) {
  const safeCount = Math.max(0, Math.min(14, Math.floor(count)));
  const used = await usedTopicIds();
  const created: BlogPost[] = [];
  const results: Array<{
    dayKey: string;
    emailed: boolean;
    reason: string;
    to?: string;
    error?: string;
    title?: string;
    slug?: string;
  }> = [];

  const batchImages = new Set<string>();
  let made = 0;
  // Scan far enough ahead that pre-scheduled published days do not block new drafts.
  for (let i = 1; made < safeCount && i <= 60; i++) {
    const dayKey = dayKeyOffset(i, now, BLOG_TZ);
    const existing = await getPostForDay(dayKey);
    if (existing) {
      const existingImage = extractHeroImage(existing.body_html);
      if (existingImage) batchImages.add(existingImage);
      if (existing.status === "draft" && existing.emailed_at === 0) {
        const mailed = await emailDraft(existing, opts?.to);
        results.push({
          dayKey,
          emailed: mailed.ok,
          reason: mailed.reason,
          to: "to" in mailed ? mailed.to : undefined,
          error: mailed.ok ? undefined : mailed.error,
          title: existing.title,
          slug: existing.slug,
        });
        if (mailed.ok) {
          created.push({ ...existing, emailed_at: mailed.emailedAt });
          made += 1;
        }
      } else {
        results.push({
          dayKey,
          emailed: false,
          reason: existing.status === "published" ? "already_published" : existing.emailed_at ? "already_emailed" : "exists",
          title: existing.title,
          slug: existing.slug,
        });
      }
      continue;
    }

    const topic = pickUnusedTopic(used, dayIndexSafe(dayKey) + i);
    used.add(topic.id);
    const blocked = await blockedImagesForNewDraft();
    const draft = buildDraft(topic, dayKey, new Set([...blocked.recent, ...blocked.all, ...batchImages]));
    const draftImage = extractHeroImage(draft.body_html);
    if (draftImage) batchImages.add(draftImage);
    await insertDraft(draft);
    const mailed = await emailDraft(draft, opts?.to);
    results.push({
      dayKey,
      emailed: mailed.ok,
      reason: mailed.reason,
      to: "to" in mailed ? mailed.to : undefined,
      error: mailed.ok ? undefined : mailed.error,
      title: draft.title,
      slug: draft.slug,
    });
    if (mailed.ok) created.push({ ...draft, emailed_at: mailed.emailedAt });
    made += 1;
  }

  return {
    ok: created.length === safeCount,
    count: safeCount,
    emailed: created.length,
    results,
  };
}

function dayIndexSafe(dayKey: string) {
  const [year, month, day] = dayKey.split("-").map(Number);
  return Math.floor(Date.UTC(year!, month! - 1, day!) / 86_400_000);
}

/** Create today's draft (if missing) and email it for approval at 7:00 SAST. Does not publish. */
export async function prepareDailyBlogDraft(now = Date.now(), opts?: { forceResend?: boolean }) {
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
    const draft = await composeDailyDraft(dayKey);
    await insertDraft(draft);
    post = draft;
  } else if (opts?.forceResend) {
    const refreshed = await composeDailyDraft(dayKey, post.id);
    await refreshDraft(post.id, refreshed);
    post = { ...refreshed, id: post.id, emailed_at: 0 };
  }

  if (post.emailed_at > 0 && !opts?.forceResend) {
    return { ok: true as const, dayKey, post, emailed: false, reason: "already_emailed" as const };
  }

  if (!opts?.forceResend && !isBlogDeliveryWindow(now)) {
    return { ok: true as const, dayKey, post, emailed: false, reason: "wait_until_7am" as const };
  }

  const mailed = await emailDraft(post);
  if (!mailed.ok) {
    return {
      ok: false as const,
      dayKey,
      post,
      emailed: false,
      reason: mailed.reason,
      error: mailed.error,
    };
  }
  return {
    ok: true as const,
    dayKey,
    post: { ...post, emailed_at: mailed.emailedAt },
    emailed: true,
    reason: "emailed" as const,
    to: mailed.to,
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

/** Reassign hero images so the newest posts (default last 5) never share an image. */
export async function uniquifyRecentBlogImages(limit = RECENT_UNIQUE_IMAGE_WINDOW) {
  const safeLimit = Math.max(1, Math.min(30, Math.floor(limit)));
  const rows = await queryAll<BlogPost>(
    await getDb(),
    `SELECT * FROM blog_posts
     WHERE status != 'rejected'
     ORDER BY COALESCE(NULLIF(published_at, 0), created_at) DESC, created_at DESC
     LIMIT ?`,
    [safeLimit],
  );

  const assigned = new Set<string>();
  const updated: Array<{ id: string; slug: string; image: string }> = [];

  // Oldest within the window first so newer posts keep preferred art when possible.
  for (const post of [...rows].reverse()) {
    const preferred = post.topic_id.startsWith("news-")
      ? preferredNewsImage(post.title, post.summary)
      : mediaForTopic(post.topic_id);
    const picked = pickUniqueImage(preferred, assigned);
    assigned.add(picked.image);

    const current = extractHeroImage(post.body_html);
    if (current === picked.image) continue;

    const bodyHtml = replaceHeroImage(post.body_html, picked.image, picked.imageAlt);
    await execute(await getDb(), "UPDATE blog_posts SET body_html = ? WHERE id = ?", [bodyHtml, post.id]);
    updated.push({ id: post.id, slug: post.slug, image: picked.image });
  }

  return { ok: true as const, checked: rows.length, updated };
}

export async function publishBlogPost(postId: string) {
  const post = await getBlogPostById(postId);
  if (!post) return { ok: false as const, error: "Draft not found." };
  if (post.status === "rejected") return { ok: false as const, error: "This draft was rejected." };

  const url = `${SITE}/blog/${post.slug}`;
  if (post.status === "published") {
    return { ok: true as const, post, url, already: true as const };
  }

  const publishedAt = Math.floor(Date.now() / 1000);
  await execute(await getDb(), "UPDATE blog_posts SET status = 'published', published_at = ? WHERE id = ?", [
    publishedAt,
    postId,
  ]);

  const indexing = await notifyPublishedUrls(url).catch((error) => ({
    indexNow: {
      ok: false as const,
      engine: "indexnow",
      error: error instanceof Error ? error.message : "Indexing notify failed.",
    },
    urls: [url],
  }));

  return {
    ok: true as const,
    post: { ...post, status: "published" as const, published_at: publishedAt },
    url,
    already: false as const,
    indexing,
  };
}
