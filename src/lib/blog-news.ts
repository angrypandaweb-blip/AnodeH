import { createHash } from "crypto";

export type BlogNewsItem = {
  id: string;
  title: string;
  url: string;
  summary: string;
  source: string;
  publishedAt: number;
};

const FEEDS = [
  { source: "Search Engine Land", url: "https://searchengineland.com/feed" },
  { source: "Search Engine Journal", url: "https://www.searchenginejournal.com/feed/" },
  { source: "Google Ads Help", url: "https://support.google.com/google-ads/topic/3121777?hl=en&output=rss" },
] as const;

const STRONG_KEYWORDS = [
  "click fraud",
  "invalid traffic",
  "invalid click",
  "ad fraud",
  "bot traffic",
  "ppc fraud",
  "ip exclusion",
  "phishing",
  "spam email",
  "conversion fraud",
  "click quality",
  "ads traffic",
  "brand safety",
  "malware",
];

const CONTEXT_KEYWORDS = ["google ads", "performance max", "paid search", "display ads", "ppc"];

const KEYWORDS = [...STRONG_KEYWORDS, ...CONTEXT_KEYWORDS];

function decodeXml(value: string) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tagValue(block: string, tag: string) {
  const match =
    block.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, "i")) ||
    block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match?.[1] ? decodeXml(match[1]) : "";
}

function linkValue(block: string) {
  const atom = block.match(/<link[^>]*href=["']([^"']+)["'][^>]*\/?>/i);
  if (atom?.[1]) return atom[1].trim();
  return tagValue(block, "link") || tagValue(block, "guid");
}

function parseFeed(xml: string, source: string): BlogNewsItem[] {
  const chunks = xml.match(/<item[\s\S]*?<\/item>|<entry[\s\S]*?<\/entry>/gi) || [];
  return chunks
    .map((chunk) => {
      const title = tagValue(chunk, "title");
      const url = linkValue(chunk);
      const summary = tagValue(chunk, "description") || tagValue(chunk, "summary") || tagValue(chunk, "content");
      const publishedRaw =
        tagValue(chunk, "pubDate") || tagValue(chunk, "published") || tagValue(chunk, "updated") || "";
      const publishedAt = publishedRaw ? Math.floor(new Date(publishedRaw).getTime() / 1000) : 0;
      if (!title || !url) return null;
      const id = createHash("sha256").update(url).digest("hex").slice(0, 16);
      return {
        id,
        title,
        url,
        summary: summary.slice(0, 500),
        source,
        publishedAt: Number.isFinite(publishedAt) ? publishedAt : 0,
      } satisfies BlogNewsItem;
    })
    .filter((item): item is BlogNewsItem => Boolean(item));
}

export function newsMatchesAnodehWork(item: Pick<BlogNewsItem, "title" | "summary">) {
  const hay = `${item.title} ${item.summary}`.toLowerCase();
  const strong = STRONG_KEYWORDS.some((keyword) => hay.includes(keyword));
  if (strong) return true;
  const hasContext = CONTEXT_KEYWORDS.some((keyword) => hay.includes(keyword));
  const hasQualityAngle = /fraud|invalid|bot|phish|spam|malware|security|quality|exclusion|abuse/.test(hay);
  return hasContext && hasQualityAngle;
}

export function scoreNewsItem(item: BlogNewsItem, now = Date.now()) {
  const hay = `${item.title} ${item.summary}`.toLowerCase();
  let score = 0;
  for (const keyword of STRONG_KEYWORDS) {
    if (hay.includes(keyword)) score += keyword.split(" ").length > 1 ? 4 : 2;
  }
  for (const keyword of CONTEXT_KEYWORDS) {
    if (hay.includes(keyword)) score += 1;
  }
  if (item.publishedAt > 0) {
    const ageDays = Math.max(0, (now / 1000 - item.publishedAt) / 86_400);
    if (ageDays <= 3) score += 4;
    else if (ageDays <= 7) score += 2;
    else if (ageDays > 21) score -= 3;
  }
  return score;
}

async function fetchFeed(feed: (typeof FEEDS)[number]) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(feed.url, {
      signal: controller.signal,
      headers: { Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, */*" },
    });
    if (!response.ok) return [] as BlogNewsItem[];
    const xml = await response.text();
    return parseFeed(xml, feed.source);
  } catch {
    return [] as BlogNewsItem[];
  } finally {
    clearTimeout(timer);
  }
}

/** Pull recent industry news related to click fraud, Google Ads, phishing, and similar. */
export async function findRelevantBlogNews(opts?: { usedUrls?: Set<string>; now?: number }) {
  const used = opts?.usedUrls || new Set<string>();
  const now = opts?.now || Date.now();
  const batches = await Promise.all(FEEDS.map((feed) => fetchFeed(feed)));
  const items = batches
    .flat()
    .filter((item) => !used.has(item.url))
    .filter((item) => newsMatchesAnodehWork(item))
    .map((item) => ({ item, score: scoreNewsItem(item, now) }))
    .filter((row) => row.score >= 3)
    .sort((a, b) => b.score - a.score || b.item.publishedAt - a.item.publishedAt);

  return items[0]?.item || null;
}

export function newsTopicId(item: BlogNewsItem) {
  return `news-${item.id}`;
}

export function newsSlugPart(item: BlogNewsItem) {
  return item.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || item.id;
}

export function renderNewsBlogHtml(item: BlogNewsItem, dayKey: string, options: { imageUrl: string; imageAlt: string; tags: string[] }) {
  const { imageUrl, imageAlt, tags } = options;
  const tagHtml = tags.map((tag) => `<span class="blog-tag">${escapeHtml(tag)}</span>`).join(" ");
  return [
    `<figure class="blog-hero"><img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(imageAlt)}" width="1600" height="900" /></figure>`,
    `<p class="blog-tags">${tagHtml}</p>`,
    `<p>${escapeHtml(item.summary || item.title)}</p>`,
    `<p>Industry news on ${escapeHtml(dayKey)} from ${escapeHtml(item.source)}, read through an AnodeH lens: how advertisers protect domains from invalid clicks, wasted Google Ads spend, and related threats.</p>`,
    `<h2>What the news is saying</h2>`,
    `<p><strong>${escapeHtml(item.title)}</strong></p>`,
    `<p>${escapeHtml(item.summary || "The linked article covers changes or risks that matter for paid traffic quality.")}</p>`,
    `<p>Source: <a href="${escapeHtml(item.url)}" rel="noopener noreferrer">${escapeHtml(item.source)}</a></p>`,
    `<h2>Why it matters for domain protection</h2>`,
    `<p>AnodeH scores Google Ads clicks on the domains you watch, writes IP exclusions on Search and Display when traffic looks invalid, and holds conversions on Performance Max when that campaign type has no IP list. News about click quality, bots, phishing, or Ads policy is directly about that work.</p>`,
    `<p>When traffic quality shifts, the practical response is the same: keep the site tag installed, review Activity and Protection, allowlist trusted IPs, and let exclusions target addresses likely to return.</p>`,
    `<h2>What to do next</h2>`,
    `<p>If this story affects your campaigns, open the AnodeH dashboard, check recent flagged and blocked clicks, and confirm the Google Ads customer ID on each protected domain. <a href="/register">Create an account</a> or read more on the <a href="/">AnodeH home page</a>.</p>`,
    `<p class="blog-tags">${tagHtml}</p>`,
  ].join("\n");
}

export function renderNewsBlogText(item: BlogNewsItem, dayKey: string, tags: string[]) {
  return [
    tags.join(" "),
    "",
    item.summary || item.title,
    "",
    `Industry news on ${dayKey} from ${item.source}, read through an AnodeH lens.`,
    "",
    "What the news is saying",
    "",
    item.title,
    "",
    item.summary || "The linked article covers changes or risks that matter for paid traffic quality.",
    "",
    `Source: ${item.url}`,
    "",
    "Why it matters for domain protection",
    "",
    "AnodeH scores Google Ads clicks on the domains you watch, writes IP exclusions on Search and Display when traffic looks invalid, and holds conversions on Performance Max when that campaign type has no IP list.",
    "",
    "What to do next",
    "",
    "Check recent flagged and blocked clicks, confirm the Google Ads customer ID on each protected domain, and keep the site tag installed.",
    "",
    tags.join(" "),
  ].join("\n");
}

export function newsHashtags(item: BlogNewsItem) {
  const hay = `${item.title} ${item.summary}`.toLowerCase();
  const tags = ["#AnodeH", "#IndustryNews", "#GoogleAds", "#ClickProtection"];
  if (hay.includes("fraud") || hay.includes("invalid") || hay.includes("bot")) tags.push("#AdFraud", "#InvalidTraffic");
  if (hay.includes("phish") || hay.includes("spam")) tags.push("#Phishing", "#SpamEmail");
  if (hay.includes("performance max") || hay.includes("pmax")) tags.push("#PerformanceMax");
  if (hay.includes("ppc") || hay.includes("paid search")) tags.push("#PPC");
  return [...new Set(tags)];
}

export function newsImage(item: BlogNewsItem) {
  const hay = `${item.title} ${item.summary}`.toLowerCase();
  if (hay.includes("phish") || hay.includes("spam") || hay.includes("email")) {
    return { image: "/blog/blog-hero-email.jpg", imageAlt: "Inbox threats and email security news" };
  }
  if (hay.includes("vpn") || hay.includes("proxy") || hay.includes("bot")) {
    return { image: "/blog/blog-hero-vpn.jpg", imageAlt: "Network and bot traffic news" };
  }
  if (hay.includes("datacenter") || hay.includes("server") || hay.includes("fraud")) {
    return { image: "/blog/blog-hero-datacenter.jpg", imageAlt: "Infrastructure behind invalid ad traffic" };
  }
  return { image: "/blog/blog-hero-dashboard.jpg", imageAlt: "Ads and click protection industry news" };
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export const __test = { parseFeed, decodeXml, KEYWORDS, FEEDS };
