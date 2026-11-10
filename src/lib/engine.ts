import { randomBytes } from "crypto";
import { CAMPAIGNS, findCampaign } from "./campaigns";
import { type Db, execute, getDb, queryAll, queryOne } from "./db";
import { enforcementFor, evaluate, guessIsp, guessNetwork } from "./score";
import type { IncomingClick, Network, Policy, Sensitivity } from "./types";

export const EXCLUSION_CAP = 500;
export const ALERT_AT = 400;
export const OFFICE_IP = "198.51.100.24";
export const COMPETITOR_IP = "73.184.22.10";

export function nid(prefix: string): string {
  return prefix + randomBytes(6).toString("hex");
}

type SettingRow = { key: string; value: string };
type CountRow = { c: number };
type IpRow = { ip: string };

export async function getPolicy(db?: Db): Promise<Policy> {
  const database = db ?? (await getDb());
  const rows = await queryAll<SettingRow>(database, "SELECT key, value FROM settings");
  const map = Object.fromEntries(rows.map((row) => [row.key, row.value]));
  const sensitivity = map.sensitivity;
  const safeSensitivity: Sensitivity =
    sensitivity === "conservative" || sensitivity === "aggressive" ? sensitivity : "balanced";
  const days = Number(map.blockDays);
  return {
    sensitivity: safeSensitivity,
    blockDays: Number.isFinite(days) ? Math.min(90, Math.max(1, Math.round(days))) : 30,
    autoBlock: map.autoBlock !== "false",
    domain: map.domain || "AnodeH.com",
    domainKey: map.domainKey || "cf_live_nw_4k9m2p",
  };
}

export async function savePolicy(patch: Partial<Policy>) {
  const db = await getDb();
  const current = await getPolicy(db);
  const next = { ...current, ...patch };
  if (patch.blockDays !== undefined) {
    next.blockDays = Math.min(90, Math.max(1, Math.round(patch.blockDays)));
  }
  const sql =
    "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value";
  await execute(db, sql, ["sensitivity", next.sensitivity]);
  await execute(db, sql, ["blockDays", String(next.blockDays)]);
  await execute(db, sql, ["autoBlock", next.autoBlock ? "true" : "false"]);
  await execute(db, sql, ["domain", next.domain]);
}

async function allowValues(db: Db): Promise<string[]> {
  const rows = await queryAll<{ value: string }>(db, "SELECT value FROM allowlist");
  return rows.map((row) => row.value);
}

export function isAllowed(ip: string, values: string[]): boolean {
  return values.some((value) => {
    if (value.endsWith("/24")) {
      const prefix = value.split(".").slice(0, 3).join(".");
      return ip.startsWith(prefix + ".");
    }
    return value === ip;
  });
}

export function to24(ip: string): string | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  if (parts.some((part) => !/^\d{1,3}$/.test(part) || Number(part) > 255)) return null;
  return `${parts[0]}.${parts[1]}.${parts[2]}.0/24`;
}

async function historyFor(db: Db, input: IncomingClick, ts: number) {
  const since = ts - 86400;
  const ipCount = await queryOne<CountRow>(
    db,
    "SELECT COUNT(*) AS c FROM clicks WHERE ip = ? AND ts > ? AND ts <= ?",
    [input.ip, since, ts],
  );
  const deviceIps = await queryAll<IpRow>(
    db,
    "SELECT DISTINCT ip FROM clicks WHERE device_hash = ? AND ts > ? AND ts <= ?",
    [input.deviceHash, ts - 7 * 86400, ts],
  );
  const known = new Set(deviceIps.map((row) => row.ip));
  known.add(input.ip);
  return { ipClicks24h: (ipCount?.c ?? 0) + 1, deviceIpCount: known.size };
}

async function checkCapacity(db: Db, ts: number) {
  const rows = await queryAll<{ campaign: string; c: number }>(
    db,
    `SELECT campaign, COUNT(*) AS c FROM blocks
     WHERE status = 'active' AND kind IN ('ip', 'subnet')
     GROUP BY campaign`,
  );
  for (const row of rows) {
    if (row.c < ALERT_AT) continue;
    const recent = await queryOne<{ id: string }>(
      db,
      "SELECT id FROM alerts WHERE message LIKE ? AND ts > ?",
      [`%${row.campaign}%full%`, ts - 86400],
    );
    if (recent) continue;
    await execute(db, "INSERT INTO alerts (id, ts, level, message, read) VALUES (?, ?, 'warning', ?, 0)", [
      nid("a"),
      ts,
      `${row.campaign} exclusion list is ${row.c} of ${EXCLUSION_CAP} full. Older addresses will be released when the ceiling is reached.`,
    ]);
  }
}

async function makeRoom(db: Db, campaign: string) {
  const count = await queryOne<CountRow>(
    db,
    `SELECT COUNT(*) AS c FROM blocks
     WHERE campaign = ? AND status = 'active' AND kind IN ('ip', 'subnet')`,
    [campaign],
  );
  if ((count?.c ?? 0) < EXCLUSION_CAP) return;
  const victim = await queryOne<{ id: string }>(
    db,
    `SELECT id FROM blocks
     WHERE campaign = ? AND status = 'active' AND kind IN ('ip', 'subnet')
     ORDER BY score ASC, created_at ASC LIMIT 1`,
    [campaign],
  );
  if (victim) {
    await execute(db, "UPDATE blocks SET status = 'evicted' WHERE id = ?", [victim.id]);
  }
}

async function upsertBlock(
  db: Db,
  block: {
    target: string;
    kind: "ip" | "subnet";
    campaign: string;
    reason: string;
    score: number;
    ts: number;
    expires: number;
    source: string;
  },
) {
  const existing = await queryOne<{ id: string }>(
    db,
    `SELECT id FROM blocks WHERE target = ? AND campaign = ? AND status = 'active' AND kind = ?`,
    [block.target, block.campaign, block.kind],
  );
  if (existing) {
    await execute(db, "UPDATE blocks SET expires_at = ?, score = MAX(score, ?), reason = ? WHERE id = ?", [
      block.expires,
      block.score,
      block.reason,
      existing.id,
    ]);
    return;
  }
  await makeRoom(db, block.campaign);
  await execute(
    db,
    `INSERT INTO blocks (id, target, kind, campaign, reason, score, created_at, expires_at, status, source)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)`,
    [
      nid("b"),
      block.target,
      block.kind,
      block.campaign,
      block.reason,
      block.score,
      block.ts,
      block.expires,
      block.source,
    ],
  );
  await checkCapacity(db, block.ts);
}

async function considerBlock(
  db: Db,
  row: {
    ip: string;
    network: string;
    campaign: string;
    campaignType: string;
    enforcement: string;
    reasons: string[];
    score: number;
    ts: number;
  },
  policy: Policy,
) {
  if (row.enforcement !== "ip_exclusion") return;
  const expires = row.ts + policy.blockDays * 86400;
  const reason = row.reasons.join(",");
  if (row.network === "datacenter") {
    const subnet = to24(row.ip);
    if (subnet) {
      const prefix = subnet.replace(".0/24", ".");
      const peers = await queryOne<CountRow>(
        db,
        `SELECT COUNT(DISTINCT ip) AS c FROM clicks
         WHERE campaign = ? AND network = 'datacenter' AND ip LIKE ? AND ts > ?`,
        [row.campaign, prefix + "%", row.ts - 7 * 86400],
      );
      if ((peers?.c ?? 0) >= 3) {
        await upsertBlock(db, {
          target: subnet,
          kind: "subnet",
          campaign: row.campaign,
          reason: "datacenter",
          score: Math.max(row.score, 70),
          ts: row.ts,
          expires,
          source: "auto",
        });
        await execute(
          db,
          `UPDATE blocks SET status = 'covered'
           WHERE campaign = ? AND status = 'active' AND kind = 'ip' AND target LIKE ?`,
          [row.campaign, prefix + "%"],
        );
        return;
      }
    }
  }
  await upsertBlock(db, {
    target: row.ip,
    kind: "ip",
    campaign: row.campaign,
    reason,
    score: row.score,
    ts: row.ts,
    expires,
    source: "auto",
  });
}

export type StoredClick = VerdictShape & {
  id: string;
  ts: number;
  ip: string;
  campaign: string;
  campaignType: string;
};

type VerdictShape = {
  score: number;
  action: string;
  enforcement: string;
  reasons: string[];
};

export async function recordClick(db: Db, input: IncomingClick): Promise<StoredClick> {
  const policy = await getPolicy(db);
  const campaign = findCampaign(input.campaign);
  const campaignName = campaign?.name ?? (input.campaign || "Unassigned");
  const campaignType = campaign?.type ?? "search";
  const countries = campaign?.countries ?? ["US"];
  const ts = input.ts ?? Math.floor(Date.now() / 1000);
  const allowed = isAllowed(input.ip, await allowValues(db));
  const history = await historyFor(db, input, ts);
  const scored = evaluate(input, history, policy, allowed, countries);
  const enforcement =
    scored.action === "block" ? enforcementFor(scored.action, campaignType) : scored.enforcement;
  const verdict = { ...scored, enforcement };
  const cost = input.cost ?? (campaign ? campaign.cpc * (0.9 + ((ts % 20) / 100)) : 1.5);
  const id = nid("c");
  await execute(
    db,
    `INSERT INTO clicks (
      id, ts, click_id, campaign, campaign_type, keyword, placement, ip, device_hash,
      country, city, isp, network, user_agent, time_on_page, engaged, converted, cost,
      score, reasons, action, enforcement
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      ts,
      input.clickId || nid("gclid_"),
      campaignName,
      campaignType,
      input.keyword ?? "",
      input.placement ?? "",
      input.ip,
      input.deviceHash,
      input.country,
      input.city ?? "",
      input.isp,
      input.network,
      input.userAgent ?? "",
      input.timeOnPage,
      input.engaged ? 1 : 0,
      input.converted ? 1 : 0,
      Math.round(cost * 100) / 100,
      verdict.score,
      JSON.stringify(verdict.reasons),
      verdict.action,
      verdict.enforcement,
    ],
  );
  await considerBlock(
    db,
    {
      ip: input.ip,
      network: input.network,
      campaign: campaignName,
      campaignType,
      enforcement: verdict.enforcement,
      reasons: verdict.reasons,
      score: verdict.score,
      ts,
    },
    policy,
  );
  return {
    id,
    ts,
    ip: input.ip,
    campaign: campaignName,
    campaignType,
    score: verdict.score,
    action: verdict.action,
    enforcement: verdict.enforcement,
    reasons: verdict.reasons,
  };
}

export async function blockManually(ip: string, campaign: string, score: number) {
  const db = await getDb();
  const policy = await getPolicy(db);
  const ts = Math.floor(Date.now() / 1000);
  const known = findCampaign(campaign);
  if (known?.type === "pmax") return { ok: false as const, error: "Performance Max cannot take an IP exclusion." };
  await upsertBlock(db, {
    target: ip,
    kind: "ip",
    campaign,
    reason: "manual",
    score: score || 70,
    ts,
    expires: ts + policy.blockDays * 86400,
    source: "manual",
  });
  return { ok: true as const };
}

export async function removeBlock(id: string) {
  const db = await getDb();
  await execute(db, "UPDATE blocks SET status = 'removed' WHERE id = ? AND status = 'active'", [id]);
}

export async function addAllow(value: string, note: string) {
  const clean = value.trim();
  if (!/^(\d{1,3}\.){3}\d{1,3}(\/24)?$/.test(clean)) {
    return { ok: false as const, error: "Enter an IPv4 address or a /24 range." };
  }
  const db = await getDb();
  await execute(
    db,
    "INSERT INTO allowlist (id, value, note) VALUES (?, ?, ?) ON CONFLICT(value) DO UPDATE SET note = excluded.note",
    [nid("w"), clean, note.trim() || "Allowed"],
  );
  return { ok: true as const };
}

export async function removeAllow(id: string) {
  const db = await getDb();
  await execute(db, "DELETE FROM allowlist WHERE id = ?", [id]);
}

export async function dismissAlerts() {
  const db = await getDb();
  await execute(db, "UPDATE alerts SET read = 1 WHERE read = 0");
}

export async function previewCeiling() {
  const db = await getDb();
  const policy = await getPolicy(db);
  const campaign = "Brand — Exact";
  const ts = Math.floor(Date.now() / 1000);
  let active =
    (
      await queryOne<CountRow>(
        db,
        `SELECT COUNT(*) AS c FROM blocks
         WHERE campaign = ? AND status = 'active' AND kind IN ('ip', 'subnet')`,
        [campaign],
      )
    )?.c ?? 0;
  let cursor = 0;
  let added = 0;
  while (active < ALERT_AT + 10 && cursor < 3000) {
    const ip = `203.0.${Math.floor(cursor / 240)}.${(cursor % 240) + 1}`;
    cursor += 1;
    if (!to24(ip)) continue;
    const existing = await queryOne<{ id: string }>(
      db,
      "SELECT id FROM blocks WHERE target = ? AND campaign = ? AND status = 'active'",
      [ip, campaign],
    );
    if (existing) continue;
    await upsertBlock(db, {
      target: ip,
      kind: "ip",
      campaign,
      reason: "manual",
      score: 60,
      ts,
      expires: ts + policy.blockDays * 86400,
      source: "manual",
    });
    active += 1;
    added += 1;
  }
  return added;
}

const NETWORKS: Network[] = ["residential", "datacenter", "vpn", "proxy"];

export function parseIncoming(body: Record<string, unknown>, fallbackIp: string): { ok: true; click: IncomingClick } | { ok: false; error: string } {
  const ip = typeof body.ip === "string" && body.ip ? body.ip : fallbackIp;
  if (!to24(ip) && ip !== "::1") return { ok: false, error: "IP address is not valid IPv4." };
  const networkInput = typeof body.network === "string" ? body.network : "";
  const network = NETWORKS.includes(networkInput as Network) ? (networkInput as Network) : guessNetwork(ip);
  const campaign = typeof body.campaign === "string" ? body.campaign : "";
  const timeOnPage = Number(body.timeOnPage ?? 0);
  const deviceHash =
    typeof body.deviceHash === "string" && body.deviceHash
      ? body.deviceHash
      : `ua-${hashText(String(body.userAgent ?? "browser") + ip)}`;
  return {
    ok: true,
    click: {
      clickId: typeof body.clickId === "string" ? body.clickId : undefined,
      campaign,
      keyword: typeof body.keyword === "string" ? body.keyword : undefined,
      placement: typeof body.placement === "string" ? body.placement : undefined,
      ip: ip === "::1" ? "127.0.0.1" : ip,
      deviceHash,
      country: typeof body.country === "string" && body.country ? body.country.toUpperCase() : "US",
      city: typeof body.city === "string" ? body.city : undefined,
      isp: typeof body.isp === "string" && body.isp ? body.isp : guessIsp(network, ip),
      network,
      userAgent: typeof body.userAgent === "string" ? body.userAgent : undefined,
      timeOnPage: Number.isFinite(timeOnPage) ? Math.max(0, timeOnPage) : 0,
      engaged: Boolean(body.engaged),
      converted: Boolean(body.converted),
      landing: typeof body.landing === "string" ? body.landing : undefined,
    },
  };
}

function hashText(value: string): string {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
}

export function campaignNames() {
  return CAMPAIGNS.map((campaign) => campaign.name);
}
