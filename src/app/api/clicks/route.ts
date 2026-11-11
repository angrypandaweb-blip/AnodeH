import { getAccess } from "@/lib/billing";
import { getDb, queryOne } from "@/lib/db";
import { parseIncoming, recordClick } from "@/lib/engine";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Send a JSON body." }, { status: 400 });
  }

  const db = await getDb();
  const owner = await queryOne<{ id: string }>(db, "SELECT id FROM users WHERE domain_key = ?", [String(body.key || "")]);
  if (!owner) return Response.json({ error: "Unknown domain key." }, { status: 401 });

  const access = await getAccess(owner.id);
  if (access.status === "unpaid") {
    return Response.json(
      { error: "Plan unpaid. The first 30 days are $34.50, then $69 every 30 days or $759 for the year." },
      { status: 402 },
    );
  }

  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const peer = forwarded || "127.0.0.1";
  const parsed = parseIncoming(body, peer);
  if (!parsed.ok) return Response.json({ error: parsed.error }, { status: 400 });

  const stored = await recordClick(db, parsed.click, owner.id);
  return Response.json({
    id: stored.id,
    score: stored.score,
    action: stored.action,
    enforcement: stored.enforcement,
    reasons: stored.reasons,
  });
}
