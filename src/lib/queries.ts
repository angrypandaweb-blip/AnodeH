import { getUser } from "./auth";
import { getDb, queryAll, queryOne } from "./db";
import { EXCLUSION_CAP } from "./engine";
import { googleClickPriceExpr } from "./google-cost";

async function mine() {
  const user = await getUser();
  return user?.id ?? "";
}

export type ClickRow = {
  id: string;
  ts: number;
  click_id: string;
  campaign: string;
  campaign_type: string;
  keyword: string;
  placement: string;
  ip: string;
  device_hash: string;
  country: string;
  city: string;
  isp: string;
  network: string;
  time_on_page: number;
  engaged: number;
  converted: number;
  cost: number;
  score: number;
  reasons: string;
  action: string;
  enforcement: string;
  channel: string;
  block_id: string | null;
  google_cost: number | null;
};

export async function weekStats() {
  const db = await getDb();
  const userId = await mine();
  const since = Math.floor(Date.now() / 1000) - 7 * 86400;
  const row = await queryOne<{
    clicks: number;
    invalid: number | null;
    waste: number | null;
    spend: number | null;
    blocked: number | null;
    paid: number | null;
    invalidPaid: number | null;
  }>(
    db,
    `SELECT
       COUNT(*) AS clicks,
       SUM(CASE WHEN action != 'allow' THEN 1 ELSE 0 END) AS invalid,
       SUM(CASE WHEN action != 'allow' THEN cost ELSE 0 END) AS waste,
       SUM(cost) AS spend,
       SUM(CASE WHEN action = 'block' THEN 1 ELSE 0 END) AS blocked,
       SUM(CASE WHEN channel != 'organic' THEN 1 ELSE 0 END) AS paid,
       SUM(CASE WHEN channel != 'organic' AND action != 'allow' THEN 1 ELSE 0 END) AS invalidPaid
     FROM clicks WHERE user_id = ? AND ts >= ?`,
    [userId, since],
  );
  return {
    clicks: row?.clicks ?? 0,
    invalid: row?.invalid ?? 0,
    waste: row?.waste ?? 0,
    spend: row?.spend ?? 0,
    blocked: row?.blocked ?? 0,
    paid: row?.paid ?? 0,
    invalidPaid: row?.invalidPaid ?? 0,
  };
}

export async function savedClickPrice() {
  const row = await queryOne<{ value: string }>(
    await getDb(),
    "SELECT value FROM user_settings WHERE user_id = ? AND key = 'avg_click_price'",
    [await mine()],
  );
  return row?.value || "";
}

export async function dailySeries() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const start = Math.floor(now.getTime() / 1000) - 6 * 86400;
  const rows = await queryAll<{ ts: number; action: string; channel: string; reasons: string }>(
    await getDb(),
    "SELECT ts, action, channel, reasons FROM clicks WHERE user_id = ? AND ts >= ?",
    [await mine(), start],
  );
  const days: { ts: number; allow: number; organic: number; flagged: number; repeat: number }[] = [];
  for (let i = 0; i < 7; i++) {
    days.push({ ts: start + i * 86400, allow: 0, organic: 0, flagged: 0, repeat: 0 });
  }
  for (const row of rows) {
    const index = Math.floor((row.ts - start) / 86400);
    if (index < 0 || index > 6) continue;
    const organic = row.channel === "organic";
    const repeated = reasonCodes(row.reasons).includes("repeat_ip");
    const day = days[index];
    if (organic && row.action === "allow") day.allow += 1;
    else if (organic && row.action === "flag") day.flagged += 1;
    else if (organic) day.organic += 1;
    else if (repeated) day.repeat += 1;
    else if (row.action === "allow") day.allow += 1;
    else day.flagged += 1;
  }
  return days;
}

function reasonCodes(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.map((reason) => String(reason)) : [];
  } catch {
    return [];
  }
}

export async function recentRisky(limit = 6): Promise<ClickRow[]> {
  return queryAll<ClickRow>(
    await getDb(),
    `SELECT c.*, NULL AS block_id FROM clicks c
     WHERE user_id = ? AND action != 'allow' ORDER BY ts DESC LIMIT ?`,
    [await mine(), limit],
  );
}

export async function activityCounts(query: string, since: number | null = null, traffic = "all", action = "all") {
  const where = ["user_id = ?"];
  const params: (string | number)[] = [await mine()];
  if (since != null) {
    where.push("ts >= ?");
    params.push(since);
  }
  if (query) {
    where.push("(ip LIKE ? OR campaign LIKE ? OR keyword LIKE ? OR placement LIKE ?)");
    const like = `%${query}%`;
    params.push(like, like, like, like);
  }
  const clause = `WHERE ${where.join(" AND ")}`;
  const rows = await queryAll<{ action: string; channel: string; c: number; cost: number | null }>(
    await getDb(),
    `SELECT action, channel, COUNT(*) AS c, SUM(CASE WHEN action = 'allow' THEN 0 ELSE cost END) AS cost
     FROM clicks ${clause} GROUP BY action, channel`,
    params,
  );
  const counts = { all: 0, allow: 0, flag: 0, block: 0, waste: 0, paid: 0, organic: 0 };
  for (const row of rows) {
    const channel = row.channel === "organic" ? "organic" : "paid";
    const inTraffic = traffic === "all" || channel === traffic;
    const inAction = action !== "allow" && action !== "flag" && action !== "block" || row.action === action;
    if (inTraffic) {
      counts.all += row.c;
      if (row.action === "allow" || row.action === "flag" || row.action === "block") counts[row.action] += row.c;
      counts.waste += row.cost ?? 0;
    }
    if (inAction) counts[channel] += row.c;
  }
  return counts;
}

export async function listClicks(action: string, query: string, page: number, pageSize = 40, since: number | null = null, traffic = "all") {
  const db = await getDb();
  const userId = await mine();
  const where = ["c.user_id = ?"];
  const params: (string | number)[] = [userId];
  if (since != null) {
    where.push("c.ts >= ?");
    params.push(since);
  }
  if (action === "allow" || action === "flag" || action === "block") {
    where.push("c.action = ?");
    params.push(action);
  }
  if (traffic === "paid" || traffic === "organic") {
    where.push("c.channel = ?");
    params.push(traffic);
  }
  if (query) {
    where.push("(c.ip LIKE ? OR c.campaign LIKE ? OR c.keyword LIKE ? OR c.placement LIKE ?)");
    const like = `%${query}%`;
    params.push(like, like, like, like);
  }
  const clause = `WHERE ${where.join(" AND ")}`;
  const total = await queryOne<{ c: number }>(db, `SELECT COUNT(*) AS c FROM clicks c ${clause}`, params);
  const offset = Math.max(0, page) * pageSize;
  const rows = await queryAll<ClickRow>(
    db,
    `SELECT c.*, (
       SELECT b.id FROM blocks b
       WHERE b.user_id = ? AND b.status = 'active' AND b.campaign = c.campaign
         AND (b.target = c.ip OR (b.kind = 'subnet' AND c.ip LIKE substr(b.target, 1, length(b.target) - 4) || '%'))
       LIMIT 1
     ) AS block_id,
     ${googleClickPriceExpr("c")} AS google_cost
     FROM clicks c ${clause}
     ORDER BY c.ts DESC
     LIMIT ? OFFSET ?`,
    [userId, ...params, pageSize, offset],
  );
  return { rows, total: total?.c ?? 0, pageSize };
}

export async function blockCounts() {
  const rows = await queryAll<{ status: string; c: number }>(
    await getDb(),
    "SELECT status, COUNT(*) AS c FROM blocks WHERE user_id = ? GROUP BY status",
    [await mine()],
  );
  const counts = { active: 0, covered: 0, expired: 0, evicted: 0, removed: 0 };
  for (const row of rows) {
    if (row.status === "active" || row.status === "covered" || row.status === "expired" || row.status === "evicted" || row.status === "removed") {
      counts[row.status] = row.c;
    }
  }
  return counts;
}

export async function listBlocks(status: string, page: number, pageSize = 20) {
  const db = await getDb();
  const safe = ["active", "expired", "evicted", "removed", "covered"].includes(status) ? status : "active";
  const userId = await mine();
  const total = await queryOne<{ c: number }>(db, "SELECT COUNT(*) AS c FROM blocks WHERE user_id = ? AND status = ?", [userId, safe]);
  const rows = await queryAll<BlockRow>(
    db,
    `SELECT * FROM blocks WHERE user_id = ? AND status = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [userId, safe, pageSize, Math.max(0, page) * pageSize],
  );
  return { rows, total: total?.c ?? 0, status: safe, pageSize };
}

export type BlockRow = {
  id: string;
  target: string;
  kind: string;
  campaign: string;
  reason: string;
  score: number;
  created_at: number;
  expires_at: number;
  status: string;
  source: string;
};

export async function capacity() {
  const rows = await queryAll<{ campaign: string; c: number }>(
    await getDb(),
    `SELECT campaign, COUNT(*) AS c FROM blocks
     WHERE user_id = ? AND status = 'active' AND kind IN ('ip', 'subnet')
     GROUP BY campaign ORDER BY c DESC`,
    [await mine()],
  );
  const fullest = rows[0]?.c ?? 0;
  return { rows, fullest, cap: EXCLUSION_CAP };
}

export async function alerts(unreadOnly = false) {
  const sql = unreadOnly
    ? "SELECT * FROM alerts WHERE user_id = ? AND read = 0 ORDER BY ts DESC LIMIT 8"
    : "SELECT * FROM alerts WHERE user_id = ? ORDER BY ts DESC LIMIT 8";
  return queryAll<{
    id: string;
    ts: number;
    level: string;
    message: string;
    read: number;
  }>(await getDb(), sql, [await mine()]);
}

export async function unreadCount() {
  const row = await queryOne<{ c: number }>(await getDb(), "SELECT COUNT(*) AS c FROM alerts WHERE user_id = ? AND read = 0", [
    await mine(),
  ]);
  return row?.c ?? 0;
}

export async function topIps(since: number | null = null) {
  const where = ["user_id = ?"];
  const params: (string | number)[] = [await mine()];
  if (since != null) {
    where.push("ts >= ?");
    params.push(since);
  }
  const price = googleClickPriceExpr("c");
  return queryAll<{ ip: string; isp: string; network: string; clicks: number; invalid: number; google_cost: number | null; priced_clicks: number }>(
    await getDb(),
    `SELECT c.ip AS ip, c.isp AS isp, c.network AS network,
       COUNT(*) AS clicks,
       SUM(CASE WHEN c.action != 'allow' THEN 1 ELSE 0 END) AS invalid,
       SUM(${price}) AS google_cost,
       SUM(CASE WHEN ${price} IS NOT NULL THEN 1 ELSE 0 END) AS priced_clicks
     FROM clicks c WHERE ${where.join(" AND ")} GROUP BY c.ip
     ORDER BY invalid DESC, clicks DESC LIMIT 8`,
    params,
  );
}

export async function topDevices(since: number | null = null) {
  const where = ["user_id = ?"];
  const params: (string | number)[] = [await mine()];
  if (since != null) {
    where.push("ts >= ?");
    params.push(since);
  }
  return queryAll<{ device_hash: string; ips: number; clicks: number; network: string; invalid: number }>(
    await getDb(),
    `SELECT device_hash,
       COUNT(DISTINCT ip) AS ips,
       COUNT(*) AS clicks,
       MAX(network) AS network,
       SUM(CASE WHEN action != 'allow' THEN 1 ELSE 0 END) AS invalid
     FROM clicks WHERE ${where.join(" AND ")} GROUP BY device_hash
     HAVING ips > 1
     ORDER BY ips DESC, invalid DESC LIMIT 6`,
    params,
  );
}

export async function topPlacements(since: number | null = null) {
  const where = ["user_id = ?", "placement != ''"];
  const params: (string | number)[] = [await mine()];
  if (since != null) {
    where.push("ts >= ?");
    params.push(since);
  }
  const price = googleClickPriceExpr("c");
  return queryAll<{ placement: string; clicks: number; invalid: number; google_cost: number | null; priced_clicks: number }>(
    await getDb(),
    `SELECT c.placement AS placement,
       COUNT(*) AS clicks,
       SUM(CASE WHEN c.action != 'allow' THEN 1 ELSE 0 END) AS invalid,
       SUM(${price}) AS google_cost,
       SUM(CASE WHEN ${price} IS NOT NULL THEN 1 ELSE 0 END) AS priced_clicks
     FROM clicks c WHERE ${where.join(" AND ")}
     GROUP BY c.placement
     ORDER BY invalid DESC, clicks DESC LIMIT 6`,
    params,
  );
}

export type GoogleLink = {
  customerId: string;
  loginCustomerId: string;
  connectedAt: number;
  syncedAt: number;
  lastError: string;
  currency: string;
};

export async function googleLink(): Promise<GoogleLink | null> {
  const row = await queryOne<{
    customer_id: string;
    login_customer_id: string;
    connected_at: number;
    synced_at: number;
    last_error: string;
    currency: string;
  }>(
    await getDb(),
    "SELECT customer_id, login_customer_id, connected_at, synced_at, last_error, currency FROM google_ads WHERE user_id = ?",
    [await mine()],
  );
  if (!row) return null;
  return {
    customerId: row.customer_id,
    loginCustomerId: row.login_customer_id,
    connectedAt: row.connected_at,
    syncedAt: row.synced_at,
    lastError: row.last_error,
    currency: row.currency || "",
  };
}

export async function googleCampaigns() {
  return queryAll<{ campaign_id: string; name: string; channel: string; status: string }>(
    await getDb(),
    "SELECT campaign_id, name, channel, status FROM google_campaigns WHERE user_id = ? ORDER BY name",
    [await mine()],
  );
}

export async function googleDaily() {
  return queryAll<{ day: string; clicks: number; cost_micros: number }>(
    await getDb(),
    `SELECT day, SUM(clicks) AS clicks, SUM(cost_micros) AS cost_micros
     FROM google_daily WHERE user_id = ? GROUP BY day ORDER BY day`,
    [await mine()],
  );
}

export async function googleClickList(limit = 12) {
  return queryAll<{ id: string; gclid: string; ts: number; campaign: string; keyword: string; device: string; ad_group: string }>(
    await getDb(),
    "SELECT id, gclid, ts, campaign, keyword, device, ad_group FROM google_clicks WHERE user_id = ? ORDER BY ts DESC, gclid LIMIT ?",
    [await mine(), limit],
  );
}

export async function allowlist() {
  return queryAll<{
    id: string;
    value: string;
    note: string;
  }>(await getDb(), "SELECT id, value, note FROM allowlist WHERE user_id = ? ORDER BY value", [await mine()]);
}
