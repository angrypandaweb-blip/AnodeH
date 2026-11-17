export const SITES_10_CENTS = 18900;
export const SITES_20_CENTS = 28900;
export const SITES_10_INTRO_CENTS = SITES_10_CENTS / 2;
export const SITES_20_INTRO_CENTS = SITES_20_CENTS / 2;

export type WebsitePlan = "sites10" | "sites20";
export type CheckoutChoice = "month" | WebsitePlan;

export function checkoutChoice(value: string | undefined): CheckoutChoice {
  if (value === "sites10" || value === "sites20") return value;
  return "month";
}

export function sitesCovered(plan: string | undefined, paidCents = 0): 1 | 10 | 20 {
  if (plan === "sites20" || paidCents === SITES_20_CENTS || paidCents === SITES_20_INTRO_CENTS) return 20;
  if (plan === "sites10" || paidCents === SITES_10_CENTS || paidCents === SITES_10_INTRO_CENTS) return 10;
  return 1;
}

export function storedSites(value: string | undefined): 1 | 10 | 20 {
  if (value === "10") return 10;
  if (value === "20") return 20;
  return 1;
}
