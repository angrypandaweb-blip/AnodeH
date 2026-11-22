import assert from "node:assert/strict";
import {
  __test,
  newsHashtags,
  newsMatchesAnodehWork,
  newsTopicId,
  renderNewsBlogHtml,
  scoreNewsItem,
} from "../src/lib/blog-news";

const sampleXml = `<?xml version="1.0"?>
<rss><channel>
<item>
  <title>Google Ads invalid traffic update for advertisers</title>
  <link>https://example.com/invalid-traffic</link>
  <description><![CDATA[New guidance on click fraud and bot traffic in paid search.]]></description>
  <pubDate>Sat, 21 Nov 2026 10:00:00 GMT</pubDate>
</item>
<item>
  <title>Best recipes for weekend baking</title>
  <link>https://example.com/baking</link>
  <description>Chocolate cake tips</description>
</item>
</channel></rss>`;

const items = __test.parseFeed(sampleXml, "Example");
assert.equal(items.length, 2);
assert.equal(items[0]!.title.includes("invalid traffic"), true);
assert.equal(newsMatchesAnodehWork(items[0]!), true);
assert.equal(newsMatchesAnodehWork(items[1]!), false);
assert.ok(scoreNewsItem(items[0]!) >= 3);
assert.match(newsTopicId(items[0]!), /^news-[a-f0-9]+$/);

const tags = newsHashtags(items[0]!);
assert.ok(tags.includes("#IndustryNews"));
assert.ok(tags.includes("#AdFraud") || tags.includes("#InvalidTraffic"));

const html = renderNewsBlogHtml(items[0]!, "2026-11-22", {
  imageUrl: "/blog/blog-hero-dashboard.jpg",
  imageAlt: "News",
  tags,
});
assert.match(html, /Industry news/);
assert.match(html, /example.com\/invalid-traffic/);
assert.match(html, /#AnodeH/);

console.log("blog-news tests passed");
