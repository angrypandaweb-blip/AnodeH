import { cache } from "react";
import { clickPrice } from "@/lib/click-price";
import { coveredDomains, trackedDomain } from "@/lib/domain";
import { execute, getDb, queryAll, queryOne } from "@/lib/db";
import { normalizeAdsAccount } from "@/lib/format";
import { storedSites } from "@/lib/site-plans";

export type Company = { domain: string; adsAccount: string; clickPrice: string };

function storedClickPrice(value: unknown): string {
  const price = clickPrice(String(value || ""));
  return price == null ? "" : String(price);
}

export function companyList(stored: string | undefined, primary: string, extra: string | undefined, adsAccount: string): Company[] {
  const saved = parseCompanies(stored);
  if (saved.length) return saved;
  const domains = coveredDomains(primary, extra).filter((domain) => domain !== "anodeh.com");
  const account = normalizeAdsAccount(adsAccount) || "";
  return domains.map((domain, index) => ({ domain, adsAccount: index === 0 ? account : "", clickPrice: "" }));
}

export function parseCompanies(stored: string | undefined): Company[] {
  if (!stored) return [];
  let value: unknown;
  try {
    value = JSON.parse(stored);
  } catch {
    return [];
  }
  if (!Array.isArray(value)) return [];
  const companies: Company[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const record = item as { domain?: unknown; adsAccount?: unknown; clickPrice?: unknown };
    const domain = trackedDomain(String(record.domain || ""));
    if (!domain || companies.some((company) => company.domain === domain)) continue;
    companies.push({
      domain,
      adsAccount: normalizeAdsAccount(String(record.adsAccount || "")) || "",
      clickPrice: storedClickPrice(record.clickPrice),
    });
  }
  return companies;
}

export function activeCompany(companies: Company[], active: string): string {
  const domain = trackedDomain(active);
  if (domain && companies.some((company) => company.domain === domain)) return domain;
  return companies[0]?.domain || "";
}

export const loadCompanies = cache(async function loadCompanies(userId: string) {
  const db = await getDb();
  const user = await queryOne<{ ads_account: string }>(db, "SELECT ads_account FROM users WHERE id = ?", [userId]);
  const rows = await queryAll<{ key: string; value: string }>(
    db,
    "SELECT key, value FROM user_settings WHERE user_id = ? AND key IN ('companies', 'domain', 'domains', 'active_company', 'site_limit')",
    [userId],
  );
  const map = Object.fromEntries(rows.map((row) => [row.key, row.value]));
  const companies = companyList(map.companies, map.domain || "", map.domains, user?.ads_account || "");
  return {
    companies,
    active: activeCompany(companies, map.active_company || map.domain || ""),
    multi: storedSites(map.site_limit) > 1,
  };
});

const SETTING =
  "INSERT INTO user_settings (user_id, key, value) VALUES (?, ?, ?) ON CONFLICT(user_id, key) DO UPDATE SET value = excluded.value";

export async function persistCompanies(userId: string, companies: Company[], active: string) {
  const chosen = activeCompany(companies, active);
  const current = companies.find((company) => company.domain === chosen);
  const db = await getDb();
  const previous = await queryOne<{ ads_account: string }>(db, "SELECT ads_account FROM users WHERE id = ?", [userId]);
  await execute(db, SETTING, [userId, "companies", JSON.stringify(companies)]);
  await execute(db, SETTING, [userId, "active_company", chosen]);
  await execute(db, SETTING, [userId, "domain", chosen]);
  await execute(db, SETTING, [userId, "domains", JSON.stringify(companies.map((company) => company.domain))]);
  const adsAccount = current?.adsAccount || "";
  await execute(db, "UPDATE users SET ads_account = ? WHERE id = ?", [adsAccount, userId]);
  const before = (previous?.ads_account || "").replace(/\D/g, "");
  const after = adsAccount.replace(/\D/g, "");
  if (before !== after) {
    await execute(db, "DELETE FROM google_campaigns WHERE user_id = ?", [userId]);
    await execute(db, "DELETE FROM google_daily WHERE user_id = ?", [userId]);
    await execute(db, "DELETE FROM google_clicks WHERE user_id = ?", [userId]);
    await execute(
      db,
      "UPDATE google_ads SET customer_id = '', synced_at = 0, last_error = '' WHERE user_id = ?",
      [userId],
    );
  }
}
