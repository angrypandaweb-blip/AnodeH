import { prepareDailyBlogDraft, prepareExtraBlogDrafts, uniquifyRecentBlogImages } from "@/lib/blog";
import { runDailyMail } from "@/lib/email-reports";
import { notifyDailySitemap } from "@/lib/indexing";
import { SPAM_SYNC_INTERVAL_SEC, syncAllSpamMailboxes } from "@/lib/spam-mail";

export const dynamic = "force-dynamic";

// Cron runs hourly; blog draft emails only during 07:00–07:59 Africa/Johannesburg.
// Pass forceBlog=1 to bypass the delivery window.

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET || "";
  const header = request.headers.get("authorization") || "";
  if (!secret || header !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }
  const url = new URL(request.url);
  const forceBlog = url.searchParams.get("forceBlog") === "1";
  const extraBlogs = Math.max(0, Math.min(14, Number(url.searchParams.get("extraBlogs") || 0) || 0));
  const [result, spam, blog, sitemap] = await Promise.all([
    runDailyMail(),
    syncAllSpamMailboxes({ maxAgeSec: SPAM_SYNC_INTERVAL_SEC }),
    prepareDailyBlogDraft(Date.now(), { forceResend: forceBlog }),
    notifyDailySitemap(),
  ]);
  const extras = extraBlogs > 0 ? await prepareExtraBlogDrafts(extraBlogs) : null;
  const blogImages = await uniquifyRecentBlogImages();
  return Response.json({ ...result, spam, blog, sitemap, extras, blogImages }, { status: result.ok ? 200 : 503 });
}
