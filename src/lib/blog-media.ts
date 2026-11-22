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

const MEDIA: Record<string, BlogMedia> = {
  "how-anodeh-protects-a-domain": {
    image: "/blog/blog-hero-domain.jpg",
    imageAlt: "Shield protecting a domain from wasted ad clicks",
    tags: tags("#InvalidTraffic", "#PPC"),
  },
  "datacenter-clicks": {
    image: "/blog/blog-hero-datacenter.jpg",
    imageAlt: "Datacenter servers that often produce invalid ad clicks",
    tags: tags("#DatacenterTraffic", "#ClickFraud", "#PPC"),
  },
  "vpn-and-proxy-exits": {
    image: "/blog/blog-hero-vpn.jpg",
    imageAlt: "Abstract network paths representing VPN and proxy exits",
    tags: tags("#VPN", "#ProxyTraffic", "#AdFraud"),
  },
  "repeat-ip-clicks": {
    image: "/blog/blog-hero-datacenter.jpg",
    imageAlt: "Repeated network traffic that drains ad budgets",
    tags: tags("#RepeatClicks", "#IPExclusion", "#AdFraud"),
  },
  "reused-devices": {
    image: "/blog/blog-hero-vpn.jpg",
    imageAlt: "Devices hopping across network exits",
    tags: tags("#DeviceFraud", "#AdFraud", "#PPC"),
  },
  "instant-bounces": {
    image: "/blog/blog-hero-dashboard.jpg",
    imageAlt: "Analytics view of short bounce visits on ads",
    tags: tags("#BounceRate", "#InvalidClicks", "#PPC"),
  },
  "off-target-countries": {
    image: "/blog/blog-hero-domain.jpg",
    imageAlt: "Global domain protection against off-target clicks",
    tags: tags("#GeoTargeting", "#InvalidTraffic"),
  },
  "search-display-exclusions": {
    image: "/blog/blog-hero-dashboard.jpg",
    imageAlt: "Campaign exclusion capacity on Search and Display",
    tags: tags("#IPExclusion", "#SearchAds", "#DisplayAds"),
  },
  "performance-max-honestly": {
    image: "/blog/blog-hero-dashboard.jpg",
    imageAlt: "Performance Max campaigns need a different protection path",
    tags: tags("#PerformanceMax", "#PMax", "#ConversionProtection"),
  },
  "site-tag-and-scoring": {
    image: "/blog/blog-hero-domain.jpg",
    imageAlt: "Site tag scoring clicks on a protected domain",
    tags: tags("#SiteTag", "#ClickScoring", "#PPC"),
  },
  "spam-email-same-account": {
    image: "/blog/blog-hero-email.jpg",
    imageAlt: "Spam and phishing filtering in the same account",
    tags: tags("#SpamEmail", "#Phishing", "#InboxProtection"),
  },
  "allowlist-trusted-ips": {
    image: "/blog/blog-hero-domain.jpg",
    imageAlt: "Trusted office IPs allowlisted beside domain protection",
    tags: tags("#Allowlist", "#IPExclusion"),
  },
  "reading-the-dashboard": {
    image: "/blog/blog-hero-dashboard.jpg",
    imageAlt: "AnodeH dashboard showing invalid click cost",
    tags: tags("#AdAnalytics", "#PPC", "#MarketingOps"),
  },
  "google-ads-customer-id": {
    image: "/blog/blog-hero-dashboard.jpg",
    imageAlt: "Connecting the right Google Ads customer ID",
    tags: tags("#GoogleAds", "#AdAccount", "#Setup"),
  },
  "organic-vs-paid": {
    image: "/blog/blog-hero-domain.jpg",
    imageAlt: "Organic visits stay free while paid clicks are protected",
    tags: tags("#OrganicSearch", "#PaidSearch", "#PPC"),
  },
  "blocked-page": {
    image: "/blog/blog-hero-domain.jpg",
    imageAlt: "Blocked invalid visitor redirected away from the domain",
    tags: tags("#BlockedTraffic", "#ClickFraud"),
  },
  "sensitivity-and-auto-block": {
    image: "/blog/blog-hero-dashboard.jpg",
    imageAlt: "Tuning sensitivity and auto-block for click protection",
    tags: tags("#AutoBlock", "#FraudPrevention"),
  },
  "placements-that-should-come-off": {
    image: "/blog/blog-hero-datacenter.jpg",
    imageAlt: "Bad placements that keep feeding invalid clicks",
    tags: tags("#Placements", "#DisplayAds", "#AdFraud"),
  },
  "multi-site-protection": {
    image: "/blog/blog-hero-domain.jpg",
    imageAlt: "Protecting many websites on one AnodeH account",
    tags: tags("#MultiSite", "#Agencies", "#PPC"),
  },
  "daily-report-email": {
    image: "/blog/blog-hero-email.jpg",
    imageAlt: "Daily email report of blocked clicks",
    tags: tags("#EmailReports", "#MarketingOps"),
  },
  "click-fraud-patterns": {
    image: "/blog/blog-hero-datacenter.jpg",
    imageAlt: "Common click fraud patterns AnodeH scores",
    tags: tags("#ClickFraud", "#InvalidTraffic", "#AdFraud"),
  },
  "saving-budget-with-exclusions": {
    image: "/blog/blog-hero-dashboard.jpg",
    imageAlt: "Saving Google Ads budget with smarter exclusions",
    tags: tags("#AdBudget", "#IPExclusion", "#ROI"),
  },
  "connecting-google-ads": {
    image: "/blog/blog-hero-dashboard.jpg",
    imageAlt: "Connecting Google Ads for paid click totals",
    tags: tags("#GoogleAds", "#Integration", "#Setup"),
  },
  "unblocking-mistakes": {
    image: "/blog/blog-hero-domain.jpg",
    imageAlt: "Unblocking a real customer excluded by mistake",
    tags: tags("#CustomerExperience", "#Allowlist"),
  },
  "domain-key-and-tag": {
    image: "/blog/blog-hero-domain.jpg",
    imageAlt: "Domain key behind the AnodeH site tag",
    tags: tags("#SiteTag", "#DomainKey", "#Setup"),
  },
  "phishing-vs-click-fraud": {
    image: "/blog/blog-hero-email.jpg",
    imageAlt: "Phishing in the inbox and click fraud on ads",
    tags: tags("#Phishing", "#ClickFraud", "#CyberSecurity"),
  },
  "why-ip-still-matters": {
    image: "/blog/blog-hero-vpn.jpg",
    imageAlt: "Why IP address still matters for ads protection",
    tags: tags("#IPAddress", "#IPExclusion", "#GoogleAds"),
  },
  "trial-then-protect": {
    image: "/blog/blog-hero-domain.jpg",
    imageAlt: "Starting with a trial then protecting the domain",
    tags: tags("#FreeTrial", "#PPC", "#Setup"),
  },
  "support-for-tag-and-ads": {
    image: "/blog/blog-hero-email.jpg",
    imageAlt: "Getting help with the site tag or Ads connection",
    tags: tags("#Support", "#Setup", "#GoogleAds"),
  },
  "putting-budget-back": {
    image: "/blog/blog-hero-dashboard.jpg",
    imageAlt: "Putting Google Ads budget back on real clicks",
    tags: tags("#AdBudget", "#ROI", "#InvalidTraffic"),
  },
};

const FALLBACK: BlogMedia = {
  image: "/blog/blog-hero-domain.jpg",
  imageAlt: "AnodeH domain and click protection",
  tags: BASE_TAGS,
};

const NEWS_FALLBACK: BlogMedia = {
  image: "/blog/blog-hero-dashboard.jpg",
  imageAlt: "Industry news related to click protection",
  tags: [...BASE_TAGS, "#IndustryNews"],
};

export function mediaForTopic(topicId: string): BlogMedia {
  if (MEDIA[topicId]) return MEDIA[topicId]!;
  if (topicId.startsWith("news-")) return NEWS_FALLBACK;
  return FALLBACK;
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
