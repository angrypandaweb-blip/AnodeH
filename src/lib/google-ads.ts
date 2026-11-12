import { execute, getDb, queryOne, type Client, type Db } from "./db";
import { normalizeAdsAccount } from "./format";
import {
  accessibleCustomerIds,
  dayTimestamp,
  googleErrorMessage,
  isManagerAccount,
  parseCampaign,
  parseClick,
  parseDaily,
  type ParsedCampaign,
  type ParsedClick,
  type ParsedDaily,
} from "./google-ads-parse";

const API = "https://googleads.googleapis.com/v26";
const STALE_SECONDS = 15 * 60;
const CLICK_LIMIT = 500;

type SearchResult = { ok: true; rows: unknown[] } | { ok: false; error: string; rows: unknown[] };

export function googleAdsConfigured() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function requestOrigin(headerList: { get(name: string): string | null }) {
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  if (!host) return "";
  const forwarded = headerList.get("x-forwarded-proto");
  const proto = forwarded || (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");
  return `${proto}://${host}`;
}

export function googleRedirectUri(origin: string) {
  return `${origin}/api/google-ads/callback`;
}

export function googleAuthUrl(origin: string, state: string) {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID || "",
    redirect_uri: googleRedirectUri(origin),
    response_type: "code",
    scope: "https://www.googleapis.com/auth/adwords",
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

type TokenResult = { ok: true; accessToken: string; refreshToken: string } | { ok: false; error: string };

async function tokenRequest(body: URLSearchParams): Promise<TokenResult> {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const payload = (await response.json().catch(() => null)) as {
    access_token?: string;
    refresh_token?: string;
    error?: string;
    error_description?: string;
  } | null;
  if (!response.ok || !payload?.access_token) {
    const message = payload?.error_description || payload?.error || "Google did not return an access token.";
    return { ok: false, error: message };
  }
  return { ok: true, accessToken: payload.access_token, refreshToken: payload.refresh_token || "" };
}

export async function exchangeGoogleCode(origin: string, code: string) {
  return tokenRequest(
    new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID || "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
      redirect_uri: googleRedirectUri(origin),
      grant_type: "authorization_code",
    }),
  );
}

async function accessTokenFor(refreshToken: string): Promise<{ ok: true; accessToken: string } | { ok: false; error: string }> {
  const result = await tokenRequest(
    new URLSearchParams({
      refresh_token: refreshToken,
      client_id: process.env.GOOGLE_CLIENT_ID || "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
      grant_type: "refresh_token",
    }),
  );
  if (!result.ok) return result;
  return { ok: true, accessToken: result.accessToken };
}

async function adsSearch(accessToken: string, customerId: string, query: string, loginCustomerId = ""): Promise<SearchResult> {
  if (!/^\d{10}$/.test(customerId)) return { ok: false, error: "Google Ads customer ID must be 10 digits.", rows: [] };
  if (loginCustomerId && !/^\d{10}$/.test(loginCustomerId)) return { ok: false, error: "Manager customer ID must be 10 digits.", rows: [] };
  const rows: unknown[] = [];
  let pageToken = "";
  for (let page = 0; page < 5; page++) {
    const response = await fetch(`${API}/customers/${customerId}/googleAds:search`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        ...(loginCustomerId ? { "login-customer-id": loginCustomerId } : {}),
      },
      body: JSON.stringify({ query, ...(pageToken ? { pageToken } : {}) }),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) return { ok: false, error: googleErrorMessage(payload, "Google Ads refused the request."), rows };
    const batch = (payload as { results?: unknown[] } | null)?.results ?? [];
    rows.push(...batch);
    pageToken = (payload as { nextPageToken?: string } | null)?.nextPageToken || "";
    if (!pageToken) break;
  }
  return { ok: true, rows };
}

async function listAccessible(accessToken: string): Promise<{ ok: true; ids: string[] } | { ok: false; error: string }> {
  const response = await fetch(`${API}/customers:listAccessibleCustomers`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) return { ok: false, error: googleErrorMessage(payload, "Google Ads did not list the accounts for this login.") };
  return { ok: true, ids: accessibleCustomerIds((payload as { resourceNames?: unknown } | null)?.resourceNames) };
}

async function remember(db: Db, userId: string, patch: { customerId?: string; loginCustomerId?: string; error?: string; synced?: boolean }) {
  const now = Math.floor(Date.now() / 1000);
  const current = await queryOne<{ customer_id: string; login_customer_id: string }>(
    db,
    "SELECT customer_id, login_customer_id FROM google_ads WHERE user_id = ?",
    [userId],
  );
  await execute(
    db,
    `UPDATE google_ads
     SET customer_id = ?, login_customer_id = ?, synced_at = ?, last_error = ?
     WHERE user_id = ?`,
    [
      patch.customerId ?? current?.customer_id ?? "",
      patch.loginCustomerId ?? current?.login_customer_id ?? "",
      patch.synced ? now : now,
      (patch.error || "").slice(0, 500),
      userId,
    ],
  );
}

async function resolveCustomer(
  accessToken: string,
  wanted: string,
  accessible: string[],
): Promise<{ ok: true; customerId: string; loginCustomerId: string } | { ok: false; error: string }> {
  if (wanted && accessible.includes(wanted)) {
    const direct = await adsSearch(accessToken, wanted, "SELECT customer.id, customer.manager FROM customer LIMIT 1");
    if (direct.ok) return { ok: true, customerId: wanted, loginCustomerId: "" };
  }
  if (wanted) {
    for (const managerId of accessible) {
      const through = await adsSearch(
        accessToken,
        wanted,
        "SELECT customer.id, customer.manager FROM customer LIMIT 1",
        managerId,
      );
      if (through.ok) return { ok: true, customerId: wanted, loginCustomerId: managerId };
    }
    const listed = accessible.map((id) => normalizeAdsAccount(id) || id).join(", ");
    return { ok: false, error: `This Google login cannot open ${normalizeAdsAccount(wanted) || wanted}. It can open ${listed || "no accounts"}.` };
  }

  const clients: string[] = [];
  for (const id of accessible) {
    const probe = await adsSearch(accessToken, id, "SELECT customer.id, customer.manager FROM customer LIMIT 1");
    if (!probe.ok) continue;
    if (!isManagerAccount(probe.rows[0])) clients.push(id);
  }
  if (clients.length === 1) return { ok: true, customerId: clients[0], loginCustomerId: "" };
  const listed = (clients.length ? clients : accessible).map((id) => normalizeAdsAccount(id) || id).join(", ");
  return { ok: false, error: `Enter the 10-digit customer ID of the account to read. This Google login can open ${listed || "no accounts"}.` };
}

function uniqueDaily(rows: ParsedDaily[]) {
  const map = new Map<string, ParsedDaily>();
  for (const row of rows) {
    const key = `${row.day}\0${row.campaign}`;
    const current = map.get(key);
    if (!current) map.set(key, { ...row });
    else {
      current.clicks += row.clicks;
      current.costMicros += row.costMicros;
    }
  }
  return [...map.values()];
}

function uniqueClicks(rows: ParsedClick[]) {
  const seen = new Set<string>();
  return rows.filter((row) => {
    if (seen.has(row.gclid)) return false;
    seen.add(row.gclid);
    return true;
  });
}

async function savePull(db: Client, userId: string, customerId: string, loginCustomerId: string, campaigns: ParsedCampaign[], daily: ParsedDaily[], clicks: ParsedClick[]) {
  const tx = await db.transaction("write");
  try {
    await execute(tx, "DELETE FROM google_campaigns WHERE user_id = ?", [userId]);
    await execute(tx, "DELETE FROM google_daily WHERE user_id = ?", [userId]);
    await execute(tx, "DELETE FROM google_clicks WHERE user_id = ?", [userId]);
    for (const campaign of campaigns) {
      await execute(
        tx,
        "INSERT INTO google_campaigns (user_id, campaign_id, name, channel, status) VALUES (?, ?, ?, ?, ?)",
        [userId, campaign.id, campaign.name, campaign.channel, campaign.status],
      );
    }
    for (const row of uniqueDaily(daily)) {
      await execute(
        tx,
        "INSERT INTO google_daily (user_id, day, campaign, clicks, cost_micros) VALUES (?, ?, ?, ?, ?)",
        [userId, row.day, row.campaign, row.clicks, row.costMicros],
      );
    }
    for (const click of uniqueClicks(clicks)) {
      await execute(
        tx,
        `INSERT INTO google_clicks (id, user_id, gclid, ts, campaign, keyword, device, ad_group)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [`g_${userId}_${click.gclid}`, userId, click.gclid, dayTimestamp(click.day), click.campaign, click.keyword, click.device, click.adGroup],
      );
    }
    const pretty = normalizeAdsAccount(customerId);
    if (pretty) await execute(tx, "UPDATE users SET ads_account = ? WHERE id = ?", [pretty, userId]);
    await execute(
      tx,
      `UPDATE google_ads SET customer_id = ?, login_customer_id = ?, synced_at = ?, last_error = '' WHERE user_id = ?`,
      [customerId, loginCustomerId, Math.floor(Date.now() / 1000), userId],
    );
    await tx.commit();
  } catch (error) {
    await tx.rollback();
    throw error;
  } finally {
    tx.close();
  }
}

export async function pullGoogleAds(userId: string) {
  const db = await getDb();
  const link = await queryOne<{ refresh_token: string }>(db, "SELECT refresh_token FROM google_ads WHERE user_id = ?", [userId]);
  if (!link) return { ok: false as const, error: "Connect Google Ads first." };
  if (!googleAdsConfigured()) {
    await remember(db, userId, { error: "Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET, then redeploy." });
    return { ok: false as const, error: "Google Ads credentials are not configured." };
  }

  const token = await accessTokenFor(link.refresh_token);
  if (!token.ok) {
    const message = token.error.includes("invalid_grant") ? "Google revoked this connection. Connect Google Ads again." : token.error;
    await remember(db, userId, { error: message });
    return { ok: false as const, error: message };
  }

  const accessible = await listAccessible(token.accessToken);
  if (!accessible.ok) {
    await remember(db, userId, { error: accessible.error });
    return { ok: false as const, error: accessible.error };
  }

  const account = await queryOne<{ ads_account: string }>(db, "SELECT ads_account FROM users WHERE id = ?", [userId]);
  const saved = await queryOne<{ customer_id: string }>(db, "SELECT customer_id FROM google_ads WHERE user_id = ?", [userId]);
  const wanted = (account?.ads_account || saved?.customer_id || "").replace(/\D/g, "");
  const resolved = await resolveCustomer(token.accessToken, /^\d{10}$/.test(wanted) ? wanted : "", accessible.ids);
  if (!resolved.ok) {
    await remember(db, userId, { error: resolved.error });
    return { ok: false as const, error: resolved.error };
  }

  const campaignResult = await adsSearch(
    token.accessToken,
    resolved.customerId,
    `SELECT campaign.id, campaign.name, campaign.status, campaign.advertising_channel_type
     FROM campaign
     WHERE campaign.status != 'REMOVED'`,
    resolved.loginCustomerId,
  );
  if (!campaignResult.ok) {
    await remember(db, userId, { customerId: resolved.customerId, loginCustomerId: resolved.loginCustomerId, error: campaignResult.error });
    return { ok: false as const, error: campaignResult.error };
  }
  const campaigns = campaignResult.rows.map(parseCampaign).filter((row): row is ParsedCampaign => Boolean(row));

  const dailyResult = await adsSearch(
    token.accessToken,
    resolved.customerId,
    `SELECT campaign.name, segments.date, metrics.clicks, metrics.cost_micros
     FROM campaign
     WHERE segments.date DURING LAST_7_DAYS`,
    resolved.loginCustomerId,
  );
  const daily = dailyResult.ok ? dailyResult.rows.map(parseDaily).filter((row): row is ParsedDaily => Boolean(row)) : [];
  const dates = [...new Set(daily.map((row) => row.day))].sort().reverse();

  const clicks: ParsedClick[] = [];
  let clickError = dailyResult.ok ? "" : dailyResult.error;
  for (const day of dates) {
    if (clicks.length >= CLICK_LIMIT) break;
    const detailed = await adsSearch(
      token.accessToken,
      resolved.customerId,
      `SELECT click_view.gclid, click_view.keyword_info.text, campaign.id, campaign.name, ad_group.name, segments.date, segments.device
       FROM click_view
       WHERE segments.date = '${day}'`,
      resolved.loginCustomerId,
    );
    const simple = detailed.ok
      ? detailed
      : await adsSearch(
          token.accessToken,
          resolved.customerId,
          `SELECT click_view.gclid, campaign.id, segments.date, segments.device
           FROM click_view
           WHERE segments.date = '${day}'`,
          resolved.loginCustomerId,
        );
    if (!simple.ok) {
      clickError = simple.error;
      continue;
    }
    for (const row of simple.rows) {
      const parsed = parseClick(row);
      if (!parsed) continue;
      clicks.push(parsed);
      if (clicks.length >= CLICK_LIMIT) break;
    }
  }

  await savePull(db, userId, resolved.customerId, resolved.loginCustomerId, campaigns, daily, clicks);
  if (clickError) await remember(db, userId, { error: `Campaigns were saved. Individual clicks were not available: ${clickError}` });
  return { ok: true as const, campaigns: campaigns.length, clicks: clicks.length };
}

export async function refreshGoogleAdsIfStale(userId: string) {
  try {
    const link = await queryOne<{ synced_at: number }>(await getDb(), "SELECT synced_at FROM google_ads WHERE user_id = ?", [userId]);
    if (!link) return false;
    const age = Math.floor(Date.now() / 1000) - link.synced_at;
    if (age >= 0 && age < STALE_SECONDS) return true;
    await pullGoogleAds(userId);
    return true;
  } catch {
    return false;
  }
}

export async function saveGoogleConnection(userId: string, refreshToken: string) {
  const now = Math.floor(Date.now() / 1000);
  await execute(
    await getDb(),
    `INSERT INTO google_ads (user_id, refresh_token, customer_id, login_customer_id, connected_at, synced_at, last_error)
     VALUES (?, ?, '', '', ?, 0, '')
     ON CONFLICT(user_id) DO UPDATE SET refresh_token = excluded.refresh_token, connected_at = excluded.connected_at, last_error = ''`,
    [userId, refreshToken, now],
  );
}

export async function disconnectGoogleAds(userId: string) {
  const db = await getDb();
  await execute(db, "DELETE FROM google_ads WHERE user_id = ?", [userId]);
  await execute(db, "DELETE FROM google_campaigns WHERE user_id = ?", [userId]);
  await execute(db, "DELETE FROM google_daily WHERE user_id = ?", [userId]);
  await execute(db, "DELETE FROM google_clicks WHERE user_id = ?", [userId]);
}

