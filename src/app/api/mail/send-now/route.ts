import { resendDailyReport } from "@/lib/email-reports";

export const dynamic = "force-dynamic";

export async function GET() {
  const result = await resendDailyReport("info@haggies.co.za");
  return Response.json(result, { status: result.ok ? 200 : 503 });
}
