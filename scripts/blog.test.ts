import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import {
  __test as mediaTest,
  extractHeroImage,
  mediaForTopic,
  pickUniqueImage,
  preferredNewsImage,
  RECENT_UNIQUE_IMAGE_WINDOW,
  replaceHeroImage,
} from "../src/lib/blog-media";
import {
  dayIndex,
  dayKeyFromMs,
  dayKeyOffset,
  pickTopicForDay,
  renderBlogHtml,
  renderBlogText,
  slugForDay,
  topicCount,
  BLOG_TOPICS,
} from "../src/lib/blog-topics";
import {
  approveUrl,
  blogApprovalEmail,
  draftApprovalLetter,
  rejectUrl,
  signBlogAction,
  verifyBlogActionToken,
} from "../src/lib/blog";

assert.ok(topicCount() >= 20, "need enough rotating topics");
assert.equal(RECENT_UNIQUE_IMAGE_WINDOW, 5);

const dayKey = dayKeyFromMs(Date.parse("2026-11-22T08:00:00Z"), "Africa/Johannesburg");
assert.equal(dayKey, "2026-11-22");
assert.equal(dayKeyOffset(1, Date.parse("2026-11-22T08:00:00Z"), "Africa/Johannesburg"), "2026-11-23");
assert.equal(dayKeyOffset(4, Date.parse("2026-11-22T08:00:00Z"), "Africa/Johannesburg"), "2026-11-26");

const topic = pickTopicForDay(dayKey);
assert.equal(pickTopicForDay(dayKey).id, topic.id);
assert.equal(slugForDay(dayKey, topic), `${dayKey}-${topic.id}`);
assert.equal(dayIndex(dayKey), dayIndex("2026-11-22"));

const media = mediaForTopic(topic.id);
assert.ok(media.tags.every((tag) => tag.startsWith("#")));
assert.ok(media.tags.includes("#AnodeH"));
assert.match(media.image, /^\/blog\/.+\.jpe?g$/);

const topicImages = BLOG_TOPICS.map((row) => mediaForTopic(row.id).image);
assert.equal(new Set(topicImages).size, topicImages.length, "each topic must have a unique hero image");
for (const image of topicImages) {
  assert.equal(existsSync(`public${image}`), true, `missing ${image}`);
}

const used = new Set<string>();
const recentFive = BLOG_TOPICS.slice(0, 5).map((row) => {
  const picked = pickUniqueImage(mediaForTopic(row.id), used);
  used.add(picked.image);
  return picked.image;
});
assert.equal(new Set(recentFive).size, 5, "last-five window must stay unique");

const taken = mediaForTopic("daily-report-email").image;
const fallbackPick = pickUniqueImage(mediaForTopic("daily-report-email"), [taken]);
assert.notEqual(fallbackPick.image, taken);

const newsPref = preferredNewsImage("Google Ads invalid traffic bot update", "fraud bots");
assert.match(newsPref.image, /blog-hero-news-/);

const sampleHtml = renderBlogHtml(topic, dayKey, { imageUrl: media.image, imageAlt: media.imageAlt });
assert.equal(extractHeroImage(sampleHtml), media.image);
const swapped = replaceHeroImage(sampleHtml, "/blog/blog-hero-news-ads.jpg", "News");
assert.equal(extractHeroImage(swapped), "/blog/blog-hero-news-ads.jpg");
assert.ok(mediaTest.BLOG_HERO_POOL.length >= topicCount());
assert.ok(readdirSync("public/blog").filter((name) => name.endsWith(".jpg")).length >= topicCount());

const html = renderBlogHtml(topic, dayKey);
assert.match(html, /<h2>/);
assert.match(html, /AnodeH/);
assert.match(html, /blog-hero/);
assert.match(html, /#AnodeH/);
assert.doesNotMatch(html, /<script/i);

const text = renderBlogText(topic, dayKey);
assert.match(text, /AnodeH/);
assert.match(text, /#GoogleAds/);
assert.ok(text.includes(topic.sections[0]!.heading));

process.env.CRON_SECRET = "test-blog-secret";
process.env.BLOG_APPROVAL_EMAIL = "owner@anodeh.com";
assert.equal(blogApprovalEmail(), "owner@anodeh.com");

const token = signBlogAction("blog_abc", "approve");
assert.ok(token.startsWith("approve.blog_abc."));
assert.deepEqual(verifyBlogActionToken(token), { postId: "blog_abc", action: "approve" });
assert.equal(verifyBlogActionToken(token.replace(/.$/, token.endsWith("a") ? "b" : "a")), null);
assert.deepEqual(verifyBlogActionToken(signBlogAction("blog_abc", "reject")), {
  postId: "blog_abc",
  action: "reject",
});

assert.match(approveUrl("blog_abc"), /\/api\/blog\/decide\?t=/);
assert.match(rejectUrl("blog_abc"), /\/api\/blog\/decide\?t=/);

const letter = draftApprovalLetter({
  id: "blog_abc",
  day_key: dayKey,
  slug: slugForDay(dayKey, topic),
  topic_id: topic.id,
  title: topic.title,
  description: topic.description,
  summary: topic.summary,
  body_html: html,
  body_text: text,
  status: "draft",
  created_at: 1,
  emailed_at: 0,
  published_at: 0,
  rejected_at: 0,
  facebook_post_id: "",
  facebook_error: "",
  source_url: "",
});
assert.match(letter.subject, /Approve AnodeH blog draft/);
assert.match(letter.text, /Nothing is public until you approve/);
assert.match(letter.text, /WhatsApp Status/);
assert.match(letter.text, /auto-post Status/);
assert.doesNotMatch(letter.text, /posts to Facebook when configured/);
assert.match(letter.html, /Approve and publish/);
assert.match(letter.html, /WhatsApp Status pack/);
assert.equal(letter.to, "owner@anodeh.com");
assert.ok(letter.whatsappStatus?.caption.includes(topic.title));

const share = readFileSync("src/components/BlogShare.tsx", "utf8");
assert.match(share, /facebook\.com\/sharer\/sharer\.php/);
assert.match(share, /Copy link/);
assert.match(share, /WhatsApp/);

const publish = readFileSync("src/lib/blog.ts", "utf8");
assert.doesNotMatch(publish, /postToFacebookPage/);
assert.match(publish, /findRelevantBlogNews/);

console.log("blog tests passed");

