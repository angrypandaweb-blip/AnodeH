import { prepareDailyBlogDraft } from "@/lib/blog";
import { runDailyMail } from "@/lib/email-reports";
import { SPAM_SYNC_INTERVAL_SEC, syncAllSpamMailboxes } from "@/lib/spam-mail";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET || "";
  const header = request.headers.get("authorization") || "";
  if (!secret || header !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }
  const [result, spam, blog] = await Promise.all([
    runDailyMail(),
    syncAllSpamMailboxes({ maxAgeSec: SPAM_SYNC_INTERVAL_SEC }),
    prepareDailyBlogDraft(),
  ]);
  return Response.json({ ...result, spam, blog }, { status: result.ok ? 200 : 503 });
}
