export const SITES_10_CENTS = 18900;
export const SITES_20_CENTS = 28900;

export type WebsitePlan = "sites10" | "sites20";
export type CheckoutChoice = "month" | "year" | WebsitePlan;

export function checkoutChoice(value: string | undefined): CheckoutChoice {
  if (value === "year" || value === "sites10" || value === "sites20") return value;
  return "month";
}

export function sitesCovered(plan: string | undefined, paidCents = 0): 1 | 10 | 20 {
  if (plan === "sites20") return 20;
  if (plan === "sites10") return 10;
  if (paidCents === SITES_20_CENTS) return 20;
  if (paidCents === SITES_10_CENTS) return 10;
  return 1;
}

export function storedSites(value: string | undefined): 1 | 10 | 20 {
  if (value === "10") return 10;
  if (value === "20") return 20;
  return 1;
}
