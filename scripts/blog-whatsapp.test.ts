import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  whatsappChatShareText,
  whatsappChatShareUrl,
  whatsappStatusCaption,
  whatsappStatusEmailBlock,
  whatsappStatusPack,
} from "../src/lib/blog-whatsapp";

const post = {
  title: "How AnodeH protects a domain from wasted ad clicks",
  summary: "Protection starts with the domain you add in Settings.",
  slug: "2026-11-22-how-anodeh-protects-a-domain",
  topic_id: "how-anodeh-protects-a-domain",
  body_html:
    '<figure class="blog-hero"><img src="/blog/blog-hero-how-anodeh-protects-a-domain.jpg" alt="Shield" width="1600" height="900" /></figure>',
};

const caption = whatsappStatusCaption(post);
assert.match(caption, /How AnodeH protects/);
assert.match(caption, /anodeh\.com\/blog\//);
assert.match(caption, /#AnodeH/);

const pack = whatsappStatusPack(post);
assert.match(pack.imageUrl, /blog-hero-how-anodeh-protects-a-domain\.jpg$/);
assert.equal(pack.caption, caption);
assert.match(pack.chatShareUrl, /^https:\/\/wa\.me\/\?text=/);
assert.ok(pack.howTo.length >= 3);

const chat = whatsappChatShareText(post);
assert.match(chat, /How AnodeH protects/);
assert.match(whatsappChatShareUrl(post), /wa\.me/);

const email = whatsappStatusEmailBlock(post);
assert.match(email.text, /WhatsApp Status/);
assert.match(email.text, /does not allow websites to auto-post Status/);
assert.match(email.html, /WhatsApp Status pack/);
assert.match(email.html, /Open Status image/);
assert.match(email.html, /Share link in a WhatsApp chat/);

const letter = readFileSync("src/lib/blog.ts", "utf8");
assert.match(letter, /whatsappStatusEmailBlock/);

const review = readFileSync("src/app/blog/review/page.tsx", "utf8");
assert.match(review, /WhatsAppStatusPack/);
assert.match(review, /Post this to WhatsApp Status/);

const share = readFileSync("src/components/BlogShare.tsx", "utf8");
assert.match(share, /WhatsApp/);
assert.match(share, /wa\.me/);

console.log("blog-whatsapp tests passed");
