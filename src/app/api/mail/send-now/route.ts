import { blogApprovalEmail, prepareExtraBlogDrafts } from "@/lib/blog";
import { SUPPORT_EMAIL, resendDailyReport, sendSpamAlertSample } from "@/lib/email-reports";

export const dynamic = "force-dynamic";

const OWNER_INBOXES = new Set(
  ["angrypandaweb@gmail.com", SUPPORT_EMAIL, "info@haggies.co.za"].map((email) => email.toLowerCase()),
);

export async function GET(request: Request) {
  const url = new URL(request.url);
  const kind = url.searchParams.get("kind") || "daily";
  if (kind === "blog") {
    const requested = (url.searchParams.get("to") || "").trim().toLowerCase();
    const allowed = new Set([...OWNER_INBOXES, blogApprovalEmail().toLowerCase()]);
    const to = requested && allowed.has(requested) ? requested : blogApprovalEmail();
    const result = await prepareExtraBlogDrafts(1, Date.now(), { to });
    const ok = result.emailed > 0 || result.results.some((row) => row.reason === "already_emailed");
    return Response.json(result, { status: ok ? 200 : 503 });
  }
  const result =
    kind === "spam" ? await sendSpamAlertSample("info@haggies.co.za") : await resendDailyReport("info@haggies.co.za");
  return Response.json(result, { status: result.ok ? 200 : 503 });
}
