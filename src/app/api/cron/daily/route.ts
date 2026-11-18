import { runDailyMail } from "@/lib/email-reports";
import { syncAllSpamMailboxes } from "@/lib/spam-mail";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET || "";
  const header = request.headers.get("authorization") || "";
  if (!secret || header !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }
  const [result, spam] = await Promise.all([runDailyMail(), syncAllSpamMailboxes()]);
  return Response.json({ ...result, spam }, { status: result.ok ? 200 : 503 });
}
