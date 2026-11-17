import type { MetadataRoute } from "next";
import { SITE } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/activity", "/threats", "/protection", "/settings", "/billing", "/thank-you", "/api/"],
    },
    sitemap: `${SITE}/sitemap.xml`,
  };
}
