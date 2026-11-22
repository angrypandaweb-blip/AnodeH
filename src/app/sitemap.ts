import type { MetadataRoute } from "next";
import { listPublishedPosts } from "@/lib/blog";
import { searchPages, SITE } from "@/lib/seo";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = searchPages.map((page) => ({
    url: page.path === "/" ? `${SITE}/` : `${SITE}${page.path}`,
    changeFrequency: (page.path === "/" || page.path === "/blog" ? "daily" : "monthly") as "daily" | "monthly",
    priority: page.path === "/" ? 1 : page.path === "/blog" ? 0.8 : 0.6,
  }));

  let posts: MetadataRoute.Sitemap = [];
  try {
    const published = await listPublishedPosts(365);
    posts = published.map((post) => ({
      url: `${SITE}/blog/${post.slug}`,
      lastModified: post.published_at ? new Date(post.published_at * 1000) : undefined,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }));
  } catch {
    posts = [];
  }

  return [...pages, ...posts];
}
