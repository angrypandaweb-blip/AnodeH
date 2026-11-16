import { knownCountry } from "./residence-currency";

export type IpSource = {
  country: string;
  isp: string;
  city: string;
};

const cache = new Map<string, { at: number; source: IpSource | null }>();
const DAY = 24 * 60 * 60 * 1000;

export function readIpSource(payload: unknown): IpSource | null {
  const row = payload as {
    success?: boolean;
    country_code?: string;
    city?: string;
    connection?: { isp?: string; org?: string };
  } | null;
  if (!row || row.success === false) return null;
  const country = String(row.country_code || "").trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(country)) return null;
  const isp = String(row.connection?.isp || row.connection?.org || "").trim().slice(0, 80);
  const city = String(row.city || "").trim().slice(0, 80);
  return { country, isp: isp || "Unknown", city };
}

export function isPublicIpv4(ip: string) {
  if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(ip)) return false;
  const parts = ip.split(".").map(Number);
  if (parts.some((part) => part > 255)) return false;
  const [a, b] = parts;
  if (a === 0 || a === 10 || a === 127) return false;
  if (a === 172 && b >= 16 && b <= 31) return false;
  if (a === 192 && b === 168) return false;
  if (a === 169 && b === 254) return false;
  return true;
}

export function isPublicIp(ip: string) {
  if (isPublicIpv4(ip)) return true;
  if (!ip.includes(":")) return false;
  const lower = ip.toLowerCase().split("%")[0];
  if (lower.length > 45 || !/^[0-9a-f:]+$/.test(lower)) return false;
  if (lower === "::1" || lower === "::") return false;
  if (lower.startsWith("fe80:") || lower.startsWith("fc") || lower.startsWith("fd")) return false;
  if (lower.startsWith("::ffff:")) return isPublicIpv4(lower.slice(7));
  return true;
}

export function firstForwardedIp(value: string | null) {
  return value?.split(",")[0]?.trim() || "";
}

export function countryHeader(value: string | null) {
  const code = (value || "").trim().toUpperCase();
  return knownCountry(code) ? code : "";
}

export async function lookupIpSource(ip: string): Promise<IpSource | null> {
  if (!isPublicIp(ip)) return null;
  const cached = cache.get(ip);
  if (cached && Date.now() - cached.at < DAY) return cached.source;
  try {
    const response = await fetch(`https://ipwho.is/${encodeURIComponent(ip)}?fields=success,country_code,city,connection`, {
      signal: AbortSignal.timeout(2500),
    });
    if (!response.ok) return null;
    const source = readIpSource(await response.json());
    cache.set(ip, { at: Date.now(), source });
    return source;
  } catch {
    return null;
  }
}
