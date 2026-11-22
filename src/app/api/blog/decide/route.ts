import { NextResponse } from "next/server";
import { publishBlogPost, rejectBlogPost, verifyBlogActionToken } from "@/lib/blog";
import { SITE } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("t") || "";
  const parsed = verifyBlogActionToken(token);
  if (!parsed) {
    return NextResponse.redirect(`${SITE}/blog/review?error=invalid`);
  }

  if (parsed.action === "reject") {
    const result = await rejectBlogPost(parsed.postId);
    if (!result.ok) {
      return NextResponse.redirect(`${SITE}/blog/review?error=${encodeURIComponent(result.error)}`);
    }
    return NextResponse.redirect(`${SITE}/blog/review?rejected=1&id=${encodeURIComponent(parsed.postId)}`);
  }

  const result = await publishBlogPost(parsed.postId);
  if (!result.ok) {
    return NextResponse.redirect(`${SITE}/blog/review?error=${encodeURIComponent(result.error)}`);
  }

  const params = new URLSearchParams({
    published: "1",
    slug: result.post.slug,
  });
  if (result.facebook.error) params.set("fb", result.facebook.error);
  else if (result.facebook.postId) params.set("fb", "posted");
  else if (result.facebook.skipped) params.set("fb", "skipped");

  return NextResponse.redirect(`${SITE}/blog/review?${params.toString()}`);
}
