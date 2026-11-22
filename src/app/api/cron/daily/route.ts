import { prepareDailyBlogDraft, prepareExtraBlogDrafts } from "@/lib/blog";
import { runDailyMail } from "@/lib/email-reports";
import { SPAM_SYNC_INTERVAL_SEC, syncAllSpamMailboxes } from "@/lib/spam-mail";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET || "";
  const header = request.headers.get("authorization") || "";
  if (!secret || header !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }
  const url = new URL(request.url);
  const forceBlog = url.searchParams.get("forceBlog") === "1";
  const extraBlogs = Math.max(0, Math.min(14, Number(url.searchParams.get("extraBlogs") || 0) || 0));
  const [result, spam, blog] = await Promise.all([
    runDailyMail(),
    syncAllSpamMailboxes({ maxAgeSec: SPAM_SYNC_INTERVAL_SEC }),
    prepareDailyBlogDraft(Date.now(), { forceResend: forceBlog }),
  ]);
  const extras = extraBlogs > 0 ? await prepareExtraBlogDrafts(extraBlogs) : null;
  return Response.json({ ...result, spam, blog, extras }, { status: result.ok ? 200 : 503 });
}
