import { SPAM_SYNC_INTERVAL_SEC, syncAllSpamMailboxes } from "@/lib/spam-mail";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET || "";
  const header = request.headers.get("authorization") || "";
  if (!secret || header !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }
  const spam = await syncAllSpamMailboxes({ maxAgeSec: SPAM_SYNC_INTERVAL_SEC });
  return Response.json({ ok: true, intervalSec: SPAM_SYNC_INTERVAL_SEC, spam });
}
