import { getDb, queryOne } from "@/lib/db";
import { sendDueDailyReport } from "@/lib/email-reports";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await queryOne<{ id: string }>(
    await getDb(),
    "SELECT id FROM users WHERE lower(email) = ?",
    ["info@haggies.co.za"],
  );
  if (!user) return Response.json({ ok: false, error: "Account not found." }, { status: 404 });
  const result = await sendDueDailyReport(user.id);
  return Response.json(
    result.ok ? result : { ...result, from: process.env.MAIL_FROM || "" },
    { status: result.ok ? 200 : 503 },
  );
}
