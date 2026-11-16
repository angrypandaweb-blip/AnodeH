const CURRENCY: Record<string, string> = {
  AE: "AED",
  AT: "EUR",
  AU: "AUD",
  BE: "EUR",
  BR: "BRL",
  BW: "BWP",
  CA: "CAD",
  CH: "CHF",
  CN: "CNY",
  CY: "EUR",
  DE: "EUR",
  DK: "DKK",
  EE: "EUR",
  ES: "EUR",
  FI: "EUR",
  FR: "EUR",
  GB: "GBP",
  GR: "EUR",
  HK: "HKD",
  IE: "EUR",
  IN: "INR",
  IT: "EUR",
  JP: "JPY",
  KE: "KES",
  KR: "KRW",
  LT: "EUR",
  LU: "EUR",
  LV: "EUR",
  MT: "EUR",
  MX: "MXN",
  NA: "NAD",
  NG: "NGN",
  NL: "EUR",
  NO: "NOK",
  NZ: "NZD",
  PL: "PLN",
  PT: "EUR",
  SE: "SEK",
  SG: "SGD",
  SI: "EUR",
  SK: "EUR",
  US: "USD",
  ZA: "ZAR",
};

const TIMEZONE: Record<string, string> = {
  AE: "Asia/Dubai",
  AT: "Europe/Vienna",
  AU: "Australia/Sydney",
  BE: "Europe/Brussels",
  BR: "America/Sao_Paulo",
  BW: "Africa/Gaborone",
  CA: "America/Toronto",
  CH: "Europe/Zurich",
  CN: "Asia/Shanghai",
  CY: "Asia/Nicosia",
  DE: "Europe/Berlin",
  DK: "Europe/Copenhagen",
  EE: "Europe/Tallinn",
  ES: "Europe/Madrid",
  FI: "Europe/Helsinki",
  FR: "Europe/Paris",
  GB: "Europe/London",
  GR: "Europe/Athens",
  HK: "Asia/Hong_Kong",
  IE: "Europe/Dublin",
  IN: "Asia/Kolkata",
  IT: "Europe/Rome",
  JP: "Asia/Tokyo",
  KE: "Africa/Nairobi",
  KR: "Asia/Seoul",
  LT: "Europe/Vilnius",
  LU: "Europe/Luxembourg",
  LV: "Europe/Riga",
  MT: "Europe/Malta",
  MX: "America/Mexico_City",
  NA: "Africa/Windhoek",
  NG: "Africa/Lagos",
  NL: "Europe/Amsterdam",
  NO: "Europe/Oslo",
  NZ: "Pacific/Auckland",
  PL: "Europe/Warsaw",
  PT: "Europe/Lisbon",
  SE: "Europe/Stockholm",
  SG: "Asia/Singapore",
  SI: "Europe/Ljubljana",
  SK: "Europe/Bratislava",
  US: "America/New_York",
  ZA: "Africa/Johannesburg",
};

const GENERIC_TLDS = new Set(["io", "ai", "me", "tv", "cc", "to", "co"]);

export function countryFromEmail(email: string): string {
  const host = email.split("@")[1]?.toLowerCase() || "";
  if (host.endsWith(".co.za") || host.endsWith(".org.za") || host.endsWith(".net.za") || host.endsWith(".za")) return "ZA";
  if (host.endsWith(".co.uk") || host.endsWith(".org.uk") || host.endsWith(".uk")) return "GB";
  if (host.endsWith(".com.au") || host.endsWith(".net.au") || host.endsWith(".au")) return "AU";
  if (host.endsWith(".co.nz") || host.endsWith(".nz")) return "NZ";
  if (host.endsWith(".co.jp") || host.endsWith(".jp")) return "JP";
  if (host.endsWith(".com.br") || host.endsWith(".br")) return "BR";
  if (host.endsWith(".co.ke") || host.endsWith(".ke")) return "KE";
  if (host.endsWith(".co.bw") || host.endsWith(".bw")) return "BW";
  if (host.endsWith(".com.na") || host.endsWith(".na")) return "NA";
  if (host.endsWith(".com.ng") || host.endsWith(".ng")) return "NG";
  const tld = host.split(".").pop() || "";
  if (/^[a-z]{2}$/.test(tld) && !GENERIC_TLDS.has(tld) && CURRENCY[tld.toUpperCase()]) return tld.toUpperCase();
  return "US";
}

export function currencyForCountry(country: string): string {
  return CURRENCY[country] || "USD";
}

export function timeZoneForCountry(country: string): string {
  return TIMEZONE[country] || "America/New_York";
}

export function placeFromEmail(email: string) {
  return placeFor("", email);
}

export function placeFor(country: string, email: string) {
  const code = /^[A-Z]{2}$/.test(country) && CURRENCY[country] ? country : countryFromEmail(email);
  return { country: code, currency: currencyForCountry(code), timeZone: timeZoneForCountry(code) };
}

export function knownCountry(code: string) {
  return /^[A-Z]{2}$/.test(code) && Boolean(CURRENCY[code]);
}

export function countryChoices() {
  const names = new Intl.DisplayNames("en", { type: "region" });
  return Object.keys(CURRENCY)
    .map((code) => ({ code, name: names.of(code) || code }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function currencyName(currency: string): string {
  return new Intl.DisplayNames("en", { type: "currency" }).of(currency) || currency;
}

export function formatMoney(value: number, currency: string): string {
  const locale = currency === "ZAR" ? "en-ZA" : currency === "GBP" ? "en-GB" : currency === "EUR" ? "de-DE" : "en-US";
  return value.toLocaleString(locale, { style: "currency", currency });
}

const rates = new Map<string, number>();

export async function usdRate(currency: string): Promise<number | null> {
  if (currency === "USD") return 1;
  const cached = rates.get(currency);
  if (cached) return cached;
  try {
    const response = await fetch(`https://api.frankfurter.dev/v1/latest?from=USD&to=${encodeURIComponent(currency)}`, {
      signal: AbortSignal.timeout(4000),
    });
    const payload = (await response.json().catch(() => null)) as { rates?: Record<string, number> } | null;
    const rate = payload?.rates?.[currency];
    if (!response.ok || !rate || !Number.isFinite(rate) || rate <= 0) return null;
    rates.set(currency, rate);
    return rate;
  } catch {
    return null;
  }
}

export async function moneyInCurrency(amount: number, from: string, to: string): Promise<string | null> {
  if (!/^[A-Z]{3}$/.test(from) || !/^[A-Z]{3}$/.test(to)) return null;
  if (from === to) return formatMoney(amount, to);
  const fromRate = await usdRate(from);
  const toRate = await usdRate(to);
  if (!fromRate || !toRate) return null;
  return formatMoney((amount / fromRate) * toRate, to);
}

export async function reportCurrency(email: string, country = ""): Promise<{ currency: string; name: string; rate: number }> {
  const currency = placeFor(country, email).currency;
  const rate = await usdRate(currency);
  if (!rate) return { currency: "USD", name: "US dollars", rate: 1 };
  return { currency, name: currencyName(currency), rate };
}
