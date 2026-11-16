import type { CampaignType } from "./types";

export type Campaign = {
  name: string;
  slug: string;
  type: CampaignType;
  cpc: number;
  countries: string[];
};

export const CAMPAIGNS: Campaign[] = [
  {
    name: "Brand — Exact",
    slug: "brand-exact",
    type: "search",
    cpc: 1.15,
    countries: ["US", "CA"],
  },
  {
    name: "Nonbrand — Hiking",
    slug: "nonbrand-hiking",
    type: "search",
    cpc: 3.4,
    countries: ["US"],
  },
  {
    name: "Display — Prospecting",
    slug: "display-prospecting",
    type: "display",
    cpc: 0.72,
    countries: ["US", "CA", "GB"],
  },
  {
    name: "Performance Max",
    slug: "performance-max",
    type: "pmax",
    cpc: 2.25,
    countries: ["US"],
  },
];

export const JUNK_PLACEMENTS = new Set([
  "cheap-clicks.example",
  "movie-free.example",
  "prize-spin.example",
  "pdf-download.example",
]);

const PROVINCE_NAMES: Record<string, string> = {
  "kwazulu-natal": "KwaZulu-Natal",
  "kwazulu natal": "KwaZulu-Natal",
};

export function provinceName(region: string | undefined): string {
  const clean = (region || "").trim().replace(/\s+/g, " ").slice(0, 80);
  if (!clean) return "";
  return PROVINCE_NAMES[clean.toLowerCase()] || clean;
}

export function visitCampaignName(incoming: string | undefined, region: string | undefined): string {
  const known = findCampaign(incoming);
  if (known) return known.name;
  const given = (incoming || "").trim();
  if (given) return given.slice(0, 120);
  return provinceName(region) || "Unassigned";
}

export function findCampaign(nameOrSlug: string | undefined): Campaign | undefined {
  if (!nameOrSlug) return undefined;
  const key = nameOrSlug.trim().toLowerCase();
  return CAMPAIGNS.find(
    (campaign) => campaign.name.toLowerCase() === key || campaign.slug === key,
  );
}
