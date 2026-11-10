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

export function findCampaign(nameOrSlug: string | undefined): Campaign | undefined {
  if (!nameOrSlug) return undefined;
  const key = nameOrSlug.trim().toLowerCase();
  return CAMPAIGNS.find(
    (campaign) => campaign.name.toLowerCase() === key || campaign.slug === key,
  );
}
