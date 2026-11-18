import { resendDailyReport, sendSpamAlertSample } from "@/lib/email-reports";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const kind = new URL(request.url).searchParams.get("kind") || "daily";
  const result = kind === "spam" ? await sendSpamAlertSample("info@haggies.co.za") : await resendDailyReport("info@haggies.co.za");
  return Response.json(result, { status: result.ok ? 200 : 503 });
}
