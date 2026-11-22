/** Hero art and hashtags for each protection blog topic. */

export type BlogMedia = {
  image: string;
  imageAlt: string;
  tags: string[];
};

const BASE_TAGS = ["#AnodeH", "#GoogleAds", "#ClickProtection", "#DomainProtection"];

function tags(...extra: string[]) {
  return [...BASE_TAGS, ...extra];
}

function hero(topicId: string) {
  return `/blog/blog-hero-${topicId}.jpg`;
}

const MEDIA: Record<string, BlogMedia> = {
  "how-anodeh-protects-a-domain": {
    image: hero("how-anodeh-protects-a-domain"),
    imageAlt: "Shield protecting a domain from wasted ad clicks",
    tags: tags("#InvalidTraffic", "#PPC"),
  },
  "datacenter-clicks": {
    image: hero("datacenter-clicks"),
    imageAlt: "Datacenter servers that often produce invalid ad clicks",
    tags: tags("#DatacenterTraffic", "#ClickFraud", "#PPC"),
  },
  "vpn-and-proxy-exits": {
    image: hero("vpn-and-proxy-exits"),
    imageAlt: "Abstract network paths representing VPN and proxy exits",
    tags: tags("#VPN", "#ProxyTraffic", "#AdFraud"),
  },
  "repeat-ip-clicks": {
    image: hero("repeat-ip-clicks"),
    imageAlt: "Repeated network traffic that drains ad budgets",
    tags: tags("#RepeatClicks", "#IPExclusion", "#AdFraud"),
  },
  "reused-devices": {
    image: hero("reused-devices"),
    imageAlt: "Devices hopping across network exits",
    tags: tags("#DeviceFraud", "#AdFraud", "#PPC"),
  },
  "instant-bounces": {
    image: hero("instant-bounces"),
    imageAlt: "Analytics view of short bounce visits on ads",
    tags: tags("#BounceRate", "#InvalidClicks", "#PPC"),
  },
  "off-target-countries": {
    image: hero("off-target-countries"),
    imageAlt: "Global domain protection against off-target clicks",
    tags: tags("#GeoTargeting", "#InvalidTraffic"),
  },
  "search-display-exclusions": {
    image: hero("search-display-exclusions"),
    imageAlt: "Campaign exclusion capacity on Search and Display",
    tags: tags("#IPExclusion", "#SearchAds", "#DisplayAds"),
  },
  "performance-max-honestly": {
    image: hero("performance-max-honestly"),
    imageAlt: "Performance Max campaigns need a different protection path",
    tags: tags("#PerformanceMax", "#PMax", "#ConversionProtection"),
  },
  "site-tag-and-scoring": {
    image: hero("site-tag-and-scoring"),
    imageAlt: "Site tag scoring clicks on a protected domain",
    tags: tags("#SiteTag", "#ClickScoring", "#PPC"),
  },
  "spam-email-same-account": {
    image: hero("spam-email-same-account"),
    imageAlt: "Spam and phishing filtering in the same account",
    tags: tags("#SpamEmail", "#Phishing", "#InboxProtection"),
  },
  "allowlist-trusted-ips": {
    image: hero("allowlist-trusted-ips"),
    imageAlt: "Trusted office IPs allowlisted beside domain protection",
    tags: tags("#Allowlist", "#IPExclusion"),
  },
  "reading-the-dashboard": {
    image: hero("reading-the-dashboard"),
    imageAlt: "AnodeH dashboard showing invalid click cost",
    tags: tags("#AdAnalytics", "#PPC", "#MarketingOps"),
  },
  "google-ads-customer-id": {
    image: hero("google-ads-customer-id"),
    imageAlt: "Connecting the right Google Ads customer ID",
    tags: tags("#GoogleAds", "#AdAccount", "#Setup"),
  },
  "organic-vs-paid": {
    image: hero("organic-vs-paid"),
    imageAlt: "Organic visits stay free while paid clicks are protected",
    tags: tags("#OrganicSearch", "#PaidSearch", "#PPC"),
  },
  "blocked-page": {
    image: hero("blocked-page"),
    imageAlt: "Blocked invalid visitor redirected away from the domain",
    tags: tags("#BlockedTraffic", "#ClickFraud"),
  },
  "sensitivity-and-auto-block": {
    image: hero("sensitivity-and-auto-block"),
    imageAlt: "Tuning sensitivity and auto-block for click protection",
    tags: tags("#AutoBlock", "#FraudPrevention"),
  },
  "placements-that-should-come-off": {
    image: hero("placements-that-should-come-off"),
    imageAlt: "Bad placements that keep feeding invalid clicks",
    tags: tags("#Placements", "#DisplayAds", "#AdFraud"),
  },
  "multi-site-protection": {
    image: hero("multi-site-protection"),
    imageAlt: "Protecting many websites on one AnodeH account",
    tags: tags("#MultiSite", "#Agencies", "#PPC"),
  },
  "daily-report-email": {
    image: hero("daily-report-email"),
    imageAlt: "Daily email report of blocked clicks",
    tags: tags("#EmailReports", "#MarketingOps"),
  },
  "click-fraud-patterns": {
    image: hero("click-fraud-patterns"),
    imageAlt: "Common click fraud patterns AnodeH scores",
    tags: tags("#ClickFraud", "#InvalidTraffic", "#AdFraud"),
  },
  "saving-budget-with-exclusions": {
    image: hero("saving-budget-with-exclusions"),
    imageAlt: "Saving Google Ads budget with smarter exclusions",
    tags: tags("#AdBudget", "#IPExclusion", "#ROI"),
  },
  "connecting-google-ads": {
    image: hero("connecting-google-ads"),
    imageAlt: "Connecting Google Ads for paid click totals",
    tags: tags("#GoogleAds", "#Integration", "#Setup"),
  },
  "unblocking-mistakes": {
    image: hero("unblocking-mistakes"),
    imageAlt: "Unblocking a real customer excluded by mistake",
    tags: tags("#CustomerExperience", "#Allowlist"),
  },
  "domain-key-and-tag": {
    image: hero("domain-key-and-tag"),
    imageAlt: "Domain key behind the AnodeH site tag",
    tags: tags("#SiteTag", "#DomainKey", "#Setup"),
  },
  "phishing-vs-click-fraud": {
    image: hero("phishing-vs-click-fraud"),
    imageAlt: "Phishing in the inbox and click fraud on ads",
    tags: tags("#Phishing", "#ClickFraud", "#CyberSecurity"),
  },
  "why-ip-still-matters": {
    image: hero("why-ip-still-matters"),
    imageAlt: "Why IP address still matters for ads protection",
    tags: tags("#IPAddress", "#IPExclusion", "#GoogleAds"),
  },
  "trial-then-protect": {
    image: hero("trial-then-protect"),
    imageAlt: "Starting with a trial then protecting the domain",
    tags: tags("#FreeTrial", "#PPC", "#Setup"),
  },
  "support-for-tag-and-ads": {
    image: hero("support-for-tag-and-ads"),
    imageAlt: "Getting help with the site tag or Ads connection",
    tags: tags("#Support", "#Setup", "#GoogleAds"),
  },
  "putting-budget-back": {
    image: hero("putting-budget-back"),
    imageAlt: "Putting Google Ads budget back on real clicks",
    tags: tags("#AdBudget", "#ROI", "#InvalidTraffic"),
  },
};

/** Shared pool used when a preferred hero is already taken. */
export const BLOG_HERO_POOL: Array<{ image: string; imageAlt: string }> = [
  ...Object.values(MEDIA).map((row) => ({ image: row.image, imageAlt: row.imageAlt })),
  { image: "/blog/blog-hero-news-ads.jpg", imageAlt: "Industry news about ads and click protection" },
  { image: "/blog/blog-hero-news-fraud.jpg", imageAlt: "Industry news about click fraud and bots" },
  { image: "/blog/blog-hero-news-email.jpg", imageAlt: "Industry news about inbox threats" },
  { image: "/blog/blog-hero-news-vpn.jpg", imageAlt: "Industry news about VPN and proxy traffic" },
  { image: "/blog/blog-hero-news-datacenter.jpg", imageAlt: "Industry news about datacenter traffic" },
  { image: "/blog/blog-hero-domain.jpg", imageAlt: "AnodeH domain and click protection" },
  { image: "/blog/blog-hero-datacenter.jpg", imageAlt: "Datacenter servers behind invalid ad clicks" },
  { image: "/blog/blog-hero-vpn.jpg", imageAlt: "VPN and proxy network paths" },
  { image: "/blog/blog-hero-dashboard.jpg", imageAlt: "Ads dashboard for click protection" },
  { image: "/blog/blog-hero-email.jpg", imageAlt: "Inbox protection and email security" },
];

const FALLBACK: BlogMedia = {
  image: "/blog/blog-hero-domain.jpg",
  imageAlt: "AnodeH domain and click protection",
  tags: BASE_TAGS,
};

const NEWS_FALLBACK: BlogMedia = {
  image: "/blog/blog-hero-news-ads.jpg",
  imageAlt: "Industry news related to click protection",
  tags: [...BASE_TAGS, "#IndustryNews"],
};

const NEWS_PREFERS: Array<{ test: (hay: string) => boolean; image: string; imageAlt: string }> = [
  {
    test: (hay) => hay.includes("phish") || hay.includes("spam") || hay.includes("email"),
    image: "/blog/blog-hero-news-email.jpg",
    imageAlt: "Inbox threats and email security news",
  },
  {
    test: (hay) => hay.includes("vpn") || hay.includes("proxy") || hay.includes("bot"),
    image: "/blog/blog-hero-news-vpn.jpg",
    imageAlt: "Network and bot traffic news",
  },
  {
    test: (hay) => hay.includes("datacenter") || hay.includes("server") || hay.includes("fraud"),
    image: "/blog/blog-hero-news-fraud.jpg",
    imageAlt: "Infrastructure behind invalid ad traffic",
  },
  {
    test: () => true,
    image: "/blog/blog-hero-news-ads.jpg",
    imageAlt: "Ads and click protection industry news",
  },
];

/** How many recent posts must keep distinct hero images. */
export const RECENT_UNIQUE_IMAGE_WINDOW = 5;

export function mediaForTopic(topicId: string): BlogMedia {
  if (MEDIA[topicId]) return MEDIA[topicId]!;
  if (topicId.startsWith("news-")) return NEWS_FALLBACK;
  return FALLBACK;
}

export function extractHeroImage(bodyHtml: string): string | null {
  const match = bodyHtml.match(/src="(\/blog\/[^"]+\.jpe?g)"/i);
  return match?.[1] || null;
}

export function mediaForPost(post: { topic_id: string; body_html: string }): BlogMedia {
  const base = mediaForTopic(post.topic_id);
  const embedded = extractHeroImage(post.body_html);
  if (embedded) return { ...base, image: embedded };
  return base;
}

export function preferredNewsImage(title: string, summary = ""): { image: string; imageAlt: string } {
  const hay = `${title} ${summary}`.toLowerCase();
  for (const row of NEWS_PREFERS) {
    if (row.test(hay)) return { image: row.image, imageAlt: row.imageAlt };
  }
  return { image: NEWS_FALLBACK.image, imageAlt: NEWS_FALLBACK.imageAlt };
}

/** Pick a hero that is not already used. Prefers the topic/news suggestion first. */
export function pickUniqueImage(
  preferred: { image: string; imageAlt: string },
  usedImages: Iterable<string>,
): { image: string; imageAlt: string } {
  const used = new Set([...usedImages].filter(Boolean));
  if (!used.has(preferred.image)) return preferred;

  for (const candidate of BLOG_HERO_POOL) {
    if (!used.has(candidate.image)) return candidate;
  }

  // Pool exhausted: fall back to preferred rather than inventing a path.
  return preferred;
}

export function mediaForTopicUnique(topicId: string, usedImages: Iterable<string>): BlogMedia {
  const preferred = mediaForTopic(topicId);
  const picked = pickUniqueImage(preferred, usedImages);
  return { ...preferred, image: picked.image, imageAlt: picked.imageAlt };
}

export function replaceHeroImage(bodyHtml: string, imageUrl: string, imageAlt?: string): string {
  let next = bodyHtml.replace(/src="\/blog\/[^"]+\.jpe?g"/i, `src="${imageUrl}"`);
  if (imageAlt) {
    next = next.replace(/alt="[^"]*"/i, `alt="${escapeHtml(imageAlt)}"`);
  }
  return next;
}

export function formatHashtagLine(tags: string[]) {
  return tags.join(" ");
}

export function renderHashtagsHtml(tags: string[]) {
  const items = tags
    .map((tag) => `<span class="blog-tag">${escapeHtml(tag)}</span>`)
    .join(" ");
  return `<p class="blog-tags">${items}</p>`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export const __test = { MEDIA, BLOG_HERO_POOL };
