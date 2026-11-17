import { getAccess } from "@/lib/billing";
import { getDb, queryOne } from "@/lib/db";
import { parseIncoming, recordClick } from "@/lib/engine";
import { lookupIpSource } from "@/lib/ip-source";

export const dynamic = "force-dynamic";

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "POST, OPTIONS",
  "access-control-allow-headers": "content-type",
  "access-control-max-age": "86400",
};

function reply(body: unknown, status = 200) {
  return Response.json(body, { status, headers: CORS });
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function POST(request: Request) {
  try {
    let body: Record<string, unknown>;
    try {
      const parsed = JSON.parse(await request.text()) as unknown;
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("not an object");
      body = parsed as Record<string, unknown>;
    } catch {
      return reply({ error: "Send a JSON body." }, 400);
    }

    const db = await getDb();
    const owner = await queryOne<{ id: string }>(db, "SELECT id FROM users WHERE domain_key = ?", [String(body.key || "")]);
    if (!owner) return reply({ error: "Unknown domain key." }, 401);

    const access = await getAccess(owner.id);
    if (access.status === "unpaid") {
      return reply(
        { error: "Plan unpaid. The first 30 days are half price, then $69, $189, or $289 every 30 days." },
        402,
      );
    }

    const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const peer = forwarded || "127.0.0.1";
    const source = await lookupIpSource(typeof body.ip === "string" && body.ip ? body.ip : peer);
    if (source) {
      body.country = source.country;
      body.isp = source.isp;
      if (source.city) body.city = source.city;
      if (source.region) body.region = source.region;
    } else if (!body.isp) {
      body.isp = "Unknown";
      body.country = "";
    }
    const parsed = parseIncoming(body, peer);
    if (!parsed.ok) return reply({ error: parsed.error }, 400);

    const stored = await recordClick(db, parsed.click, owner.id);
    return reply({
      id: stored.id,
      score: stored.score,
      action: stored.action,
      enforcement: stored.enforcement,
      reasons: stored.reasons,
    });
  } catch {
    return reply({ error: "Could not record the click." }, 500);
  }
}
