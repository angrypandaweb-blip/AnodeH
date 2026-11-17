import type { MetadataRoute } from "next";
import { searchPages, SITE } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  return searchPages.map((page) => ({
    url: page.path === "/" ? `${SITE}/` : `${SITE}${page.path}`,
    changeFrequency: page.path === "/" ? "weekly" : "monthly",
    priority: page.path === "/" ? 1 : 0.6,
  }));
}
