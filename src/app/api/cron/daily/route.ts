import { prepareDailyBlogDraft } from "@/lib/blog";
import { runDailyMail } from "@/lib/email-reports";
import { notifyDailySitemap } from "@/lib/indexing";
import { SPAM_SYNC_INTERVAL_SEC, syncAllSpamMailboxes } from "@/lib/spam-mail";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET || "";
  const header = request.headers.get("authorization") || "";
  if (!secret || header !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }
  const forceBlog = new URL(request.url).searchParams.get("forceBlog") === "1";
  const [result, spam, blog, sitemap] = await Promise.all([
    runDailyMail(),
    syncAllSpamMailboxes({ maxAgeSec: SPAM_SYNC_INTERVAL_SEC }),
    prepareDailyBlogDraft(Date.now(), { forceResend: forceBlog }),
    notifyDailySitemap(),
  ]);
  return Response.json({ ...result, spam, blog, sitemap }, { status: result.ok ? 200 : 503 });
}
