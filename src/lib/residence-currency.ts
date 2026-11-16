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

export async function reportCurrency(email: string): Promise<{ currency: string; name: string; rate: number }> {
  const currency = currencyForCountry(countryFromEmail(email));
  const rate = await usdRate(currency);
  if (!rate) return { currency: "USD", name: "US dollars", rate: 1 };
  return { currency, name: currencyName(currency), rate };
}
