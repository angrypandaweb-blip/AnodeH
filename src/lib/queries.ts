import { getUser } from "./auth";
import { getDb, queryAll, queryOne } from "./db";
import { EXCLUSION_CAP } from "./engine";

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
  block_id: string | null;
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
  }>(
    db,
    `SELECT
       COUNT(*) AS clicks,
       SUM(CASE WHEN action != 'allow' THEN 1 ELSE 0 END) AS invalid,
       SUM(CASE WHEN action != 'allow' THEN cost ELSE 0 END) AS waste,
       SUM(cost) AS spend,
       SUM(CASE WHEN action = 'block' THEN 1 ELSE 0 END) AS blocked
     FROM clicks WHERE user_id = ? AND ts >= ?`,
    [userId, since],
  );
  return {
    clicks: row?.clicks ?? 0,
    invalid: row?.invalid ?? 0,
    waste: row?.waste ?? 0,
    spend: row?.spend ?? 0,
    blocked: row?.blocked ?? 0,
  };
}

export async function dailySeries() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const start = Math.floor(now.getTime() / 1000) - 6 * 86400;
  const rows = await queryAll<{ ts: number; action: string }>(
    await getDb(),
    "SELECT ts, action FROM clicks WHERE user_id = ? AND ts >= ?",
    [await mine(), start],
  );
  const days: { ts: number; allow: number; other: number }[] = [];
  for (let i = 0; i < 7; i++) {
    days.push({ ts: start + i * 86400, allow: 0, other: 0 });
  }
  for (const row of rows) {
    const index = Math.floor((row.ts - start) / 86400);
    if (index < 0 || index > 6) continue;
    if (row.action === "allow") days[index].allow += 1;
    else days[index].other += 1;
  }
  return days;
}

export async function recentRisky(limit = 6): Promise<ClickRow[]> {
  return queryAll<ClickRow>(
    await getDb(),
    `SELECT c.*, NULL AS block_id FROM clicks c
     WHERE user_id = ? AND action != 'allow' ORDER BY ts DESC LIMIT ?`,
    [await mine(), limit],
  );
}

export async function activityCounts(query: string) {
  const where = ["user_id = ?"];
  const params: string[] = [await mine()];
  if (query) {
    where.push("(ip LIKE ? OR campaign LIKE ? OR keyword LIKE ? OR placement LIKE ?)");
    const like = `%${query}%`;
    params.push(like, like, like, like);
  }
  const clause = `WHERE ${where.join(" AND ")}`;
  const rows = await queryAll<{ action: string; c: number; cost: number | null }>(
    await getDb(),
    `SELECT action, COUNT(*) AS c, SUM(CASE WHEN action = 'allow' THEN 0 ELSE cost END) AS cost
     FROM clicks ${clause} GROUP BY action`,
    params,
  );
  const counts = { all: 0, allow: 0, flag: 0, block: 0, waste: 0 };
  for (const row of rows) {
    counts.all += row.c;
    if (row.action === "allow" || row.action === "flag" || row.action === "block") counts[row.action] += row.c;
    counts.waste += row.cost ?? 0;
  }
  return counts;
}

export async function listClicks(action: string, query: string, page: number, pageSize = 40) {
  const db = await getDb();
  const userId = await mine();
  const where = ["c.user_id = ?"];
  const params: (string | number)[] = [userId];
  if (action === "allow" || action === "flag" || action === "block") {
    where.push("c.action = ?");
    params.push(action);
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
     ) AS block_id
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

export async function topIps() {
  return queryAll<{ ip: string; isp: string; network: string; clicks: number; invalid: number; cost: number }>(
    await getDb(),
    `SELECT ip, isp, network,
       COUNT(*) AS clicks,
       SUM(CASE WHEN action != 'allow' THEN 1 ELSE 0 END) AS invalid,
       SUM(cost) AS cost
     FROM clicks WHERE user_id = ? GROUP BY ip
     ORDER BY invalid DESC, clicks DESC LIMIT 8`,
    [await mine()],
  );
}

export async function topDevices() {
  return queryAll<{ device_hash: string; ips: number; clicks: number; network: string; invalid: number }>(
    await getDb(),
    `SELECT device_hash,
       COUNT(DISTINCT ip) AS ips,
       COUNT(*) AS clicks,
       MAX(network) AS network,
       SUM(CASE WHEN action != 'allow' THEN 1 ELSE 0 END) AS invalid
     FROM clicks WHERE user_id = ? GROUP BY device_hash
     HAVING ips > 1
     ORDER BY ips DESC, invalid DESC LIMIT 6`,
    [await mine()],
  );
}

export async function topPlacements() {
  return queryAll<{ placement: string; clicks: number; invalid: number; cost: number }>(
    await getDb(),
    `SELECT placement,
       COUNT(*) AS clicks,
       SUM(CASE WHEN action != 'allow' THEN 1 ELSE 0 END) AS invalid,
       SUM(cost) AS cost
     FROM clicks WHERE user_id = ? AND placement != ''
     GROUP BY placement
     ORDER BY invalid DESC, clicks DESC LIMIT 6`,
    [await mine()],
  );
}

export async function allowlist() {
  return queryAll<{
    id: string;
    value: string;
    note: string;
  }>(await getDb(), "SELECT id, value, note FROM allowlist WHERE user_id = ? ORDER BY value", [await mine()]);
}
