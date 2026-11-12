import { runDailyMail } from "@/lib/email-reports";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET || "";
  const header = request.headers.get("authorization") || "";
  if (!secret || header !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }
  const result = await runDailyMail();
  return Response.json(result, { status: result.ok ? 200 : 503 });
}
