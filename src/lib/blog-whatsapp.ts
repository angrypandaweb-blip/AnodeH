import { mediaForPost, mediaForTopic, type BlogMedia } from "@/lib/blog-media";
import { SITE } from "@/lib/seo";

export type BlogWhatsAppPost = {
  title: string;
  summary: string;
  slug: string;
  topic_id: string;
  body_html?: string;
};

/** Short caption for WhatsApp Status (photo + text). Status cannot be posted by API. */
export function whatsappStatusCaption(post: BlogWhatsAppPost, media?: BlogMedia) {
  const tags = (media || mediaForTopic(post.topic_id)).tags.slice(0, 4).join(" ");
  const hook = post.summary.replace(/\s+/g, " ").trim().slice(0, 160);
  const url = postUrl(post.slug);
  return [`${post.title}`, "", hook, "", `Read: ${url}`, "", tags].join("\n");
}

/** Text you can send in a WhatsApp chat (not Status). */
export function whatsappChatShareText(post: BlogWhatsAppPost) {
  const url = postUrl(post.slug);
  return `${post.title}\n\n${url}`;
}

export function whatsappChatShareUrl(post: BlogWhatsAppPost) {
  return `https://wa.me/?text=${encodeURIComponent(whatsappChatShareText(post))}`;
}

export function postUrl(slug: string) {
  return `${SITE}/blog/${slug}`;
}

export function whatsappStatusImageUrl(post: BlogWhatsAppPost) {
  const media = post.body_html
    ? mediaForPost({ topic_id: post.topic_id, body_html: post.body_html })
    : mediaForTopic(post.topic_id);
  const path = media.image.startsWith("http") ? media.image : `${SITE}${media.image}`;
  return { url: path, alt: media.imageAlt, media };
}

export function whatsappStatusPack(post: BlogWhatsAppPost) {
  const image = whatsappStatusImageUrl(post);
  const caption = whatsappStatusCaption(post, image.media);
  return {
    caption,
    imageUrl: image.url,
    imageAlt: image.alt,
    postUrl: postUrl(post.slug),
    chatShareUrl: whatsappChatShareUrl(post),
    /** How to post Status by hand — WhatsApp has no official Status publish API. */
    howTo: [
      "Open the Status image (save it to your phone).",
      "In WhatsApp, tap Updates → My status → add the photo.",
      "Paste the caption, then post.",
    ],
  };
}

export function whatsappStatusEmailBlock(post: BlogWhatsAppPost) {
  const pack = whatsappStatusPack(post);
  const text = [
    "WhatsApp Status (post by hand — WhatsApp does not allow websites to auto-post Status):",
    "",
    `Image: ${pack.imageUrl}`,
    "",
    "Caption to paste:",
    pack.caption,
    "",
    ...pack.howTo.map((step, i) => `${i + 1}. ${step}`),
    "",
    `Or share the link in a WhatsApp chat: ${pack.chatShareUrl}`,
  ].join("\n");

  const html = `<div style="border:1px solid #e3ebf4;border-radius:12px;padding:16px;margin:18px 0;background:#f8fafc">
<p style="margin:0 0 8px"><strong>WhatsApp Status pack</strong></p>
<p style="margin:0 0 12px;color:#3e5168;font-size:14px">WhatsApp does not let websites auto-post Status. After you publish, save the image and paste this caption on your Status.</p>
<p style="margin:0 0 8px"><a href="${escapeAttr(pack.imageUrl)}">Open Status image</a></p>
<pre style="white-space:pre-wrap;font-family:ui-monospace,Menlo,monospace;font-size:13px;background:#fff;border:1px solid #e3ebf4;border-radius:8px;padding:12px;margin:0 0 12px">${escapeHtml(pack.caption)}</pre>
<ol style="margin:0 0 12px;padding-left:18px;color:#3e5168;font-size:14px">
${pack.howTo.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}
</ol>
<p style="margin:0;font-size:14px"><a href="${escapeAttr(pack.chatShareUrl)}">Share link in a WhatsApp chat</a></p>
</div>`;

  return { text, html, pack };
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function escapeAttr(value: string) {
  return escapeHtml(value);
}
