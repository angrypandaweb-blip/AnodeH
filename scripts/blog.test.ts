import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  dayIndex,
  dayKeyFromMs,
  pickTopicForDay,
  renderBlogHtml,
  renderBlogText,
  slugForDay,
  topicCount,
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

const dayKey = dayKeyFromMs(Date.parse("2026-11-22T08:00:00Z"), "Africa/Johannesburg");
assert.equal(dayKey, "2026-11-22");

const topic = pickTopicForDay(dayKey);
assert.equal(pickTopicForDay(dayKey).id, topic.id);
assert.equal(slugForDay(dayKey, topic), `${dayKey}-${topic.id}`);
assert.equal(dayIndex(dayKey), dayIndex("2026-11-22"));

const html = renderBlogHtml(topic, dayKey);
assert.match(html, /<h2>/);
assert.match(html, /AnodeH/);
assert.doesNotMatch(html, /<script/i);

const text = renderBlogText(topic, dayKey);
assert.match(text, /AnodeH/);
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
});
assert.match(letter.subject, /Approve AnodeH blog draft/);
assert.match(letter.text, /Nothing is public until you approve/);
assert.match(letter.text, /share button/);
assert.doesNotMatch(letter.text, /posts to Facebook when configured/);
assert.match(letter.html, /Approve and publish/);
assert.equal(letter.to, "owner@anodeh.com");

const share = readFileSync("src/components/BlogShare.tsx", "utf8");
assert.match(share, /facebook\.com\/sharer\/sharer\.php/);
assert.match(share, /Copy link/);

const publish = readFileSync("src/lib/blog.ts", "utf8");
assert.doesNotMatch(publish, /postToFacebookPage/);

console.log("blog tests passed");
