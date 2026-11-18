import { headers } from "next/headers";
import { getUser } from "@/lib/auth";
import { execute, getDb, queryOne } from "@/lib/db";
import { sendPurchaseReceipt } from "@/lib/email-reports";
import { convertUsdCents, formatMoney, reportCurrency } from "@/lib/residence-currency";
import {
  type CheckoutChoice,
  SITES_10_CENTS,
  SITES_10_INTRO_CENTS,
  SITES_20_CENTS,
  SITES_20_INTRO_CENTS,
  sitesCovered,
  storedSites,
} from "@/lib/site-plans";

export { SITES_10_CENTS, SITES_10_INTRO_CENTS, SITES_20_CENTS, SITES_20_INTRO_CENTS } from "@/lib/site-plans";

export const PERIOD_DAYS = 30;
export const TRIAL_DAYS = 7;
export const YEAR_DAYS = 365;
export const STANDARD_CENTS = 6900;
export const INTRO_CENTS = 3450;
export const TRIAL_CENTS = 0;
export const ANNUAL_CENTS = 75900;

const DAY = 24 * 60 * 60;

export type AccessStatus = "active" | "unpaid";

export type Access = {
  status: AccessStatus;
  endsAt: number;
  daysLeft: number;
  paidUntil: number;
  introUsed: boolean;
  lifetime: boolean;
  sites: 1 | 10 | 20;
};

function nowSec() {
  return Math.floor(Date.now() / 1000);
}

function daysLeft(endsAt: number, now: number) {
  return Math.max(0, Math.ceil((endsAt - now) / DAY));
}

export function dollars(cents: number) {
  const amount = cents / 100;
  return `$${cents % 100 === 0 ? amount.toFixed(0) : amount.toFixed(2)}`;
}

export function planDate(ts: number) {
  return new Date(ts * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function dayPhrase(days: number) {
  return days === 1 ? "1 day" : `${days} days`;
}

function sharedSetting(key: string) {
  return key.startsWith("paypal_product_") || key.startsWith("paypal_plan_");
}

async function setting(key: string, userId?: string) {
  const db = await getDb();
  if (sharedSetting(key)) {
    const row = await queryOne<{ value: string }>(db, "SELECT value FROM settings WHERE key = ?", [key]);
    return row?.value;
  }
  const id = userId || (await getUser())?.id;
  if (!id) return undefined;
  const row = await queryOne<{ value: string }>(db, "SELECT value FROM user_settings WHERE user_id = ? AND key = ?", [id, key]);
  return row?.value;
}

async function saveSetting(key: string, value: string, userId?: string) {
  const db = await getDb();
  if (sharedSetting(key)) {
    await execute(
      db,
      "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
      [key, value],
    );
    return;
  }
  const id = userId || (await getUser())?.id;
  if (!id) return;
  await execute(
    db,
    "INSERT INTO user_settings (user_id, key, value) VALUES (?, ?, ?) ON CONFLICT(user_id, key) DO UPDATE SET value = excluded.value",
    [id, key, value],
  );
}

export async function getAccess(userId?: string): Promise<Access> {
  await syncPayPalSubscription(userId);
  const paidUntil = Number((await setting("paid_until", userId)) || 0);
  const introUsed = (await setting("intro_used", userId)) === "1";
  const lifetime = (await setting("lifetime", userId)) === "1";
  const sites = storedSites(await setting("site_limit", userId));
  const now = nowSec();
  if (lifetime) {
    return { status: "active", endsAt: 0, daysLeft: 0, paidUntil, introUsed, lifetime: true, sites };
  }
  if (paidUntil > now) {
    return { status: "active", endsAt: paidUntil, daysLeft: daysLeft(paidUntil, now), paidUntil, introUsed, lifetime: false, sites };
  }
  return { status: "unpaid", endsAt: paidUntil, daysLeft: 0, paidUntil, introUsed, lifetime: false, sites };
}

export type PlanQuote = {
  currency: string;
  name: string;
  half: string;
  standard: string;
  half10: string;
  sites10: string;
  half20: string;
  sites20: string;
};

export async function quotesFor(email: string, country: string): Promise<PlanQuote> {
  const local = await reportCurrency(email, country);
  const money = (cents: number) => formatMoney(convertUsdCents(cents, local.rate), local.currency);
  return {
    currency: local.currency,
    name: local.name,
    half: money(INTRO_CENTS),
    standard: money(STANDARD_CENTS),
    half10: money(SITES_10_INTRO_CENTS),
    sites10: money(SITES_10_CENTS),
    half20: money(SITES_20_INTRO_CENTS),
    sites20: money(SITES_20_CENTS),
  };
}

export function planSummary(access: Access, quote?: PlanQuote) {
  const half = quote?.half ?? dollars(INTRO_CENTS);
  const standard = quote?.standard ?? dollars(STANDARD_CENTS);
  if (access.lifetime) {
    return { title: "Lifetime", detail: "This account does not expire." };
  }
  if (access.status === "active") {
    const websites = access.sites > 1 ? ` · ${access.sites} websites` : "";
    return { title: `Paid · ${dayPhrase(access.daysLeft)} left${websites}`, detail: `Through ${planDate(access.endsAt)}` };
  }
  if (access.introUsed) {
    return { title: "Plan unpaid", detail: `${standard} every 30 days` };
  }
  return {
    title: "7-day free trial",
    detail: `Free for ${TRIAL_DAYS} days, then ${standard} every 30 days`,
  };
}

type PlanId = "intro" | "month" | "year";

const PLANS: Record<PlanId, { cents: number; days: number; name: string }> = {
  intro: { cents: INTRO_CENTS, days: PERIOD_DAYS, name: "AnodeH — first 30 days" },
  month: { cents: STANDARD_CENTS, days: PERIOD_DAYS, name: "AnodeH — 30 days" },
  year: { cents: ANNUAL_CENTS, days: YEAR_DAYS, name: "AnodeH — 1 year" },
};

function isPlan(value: string | undefined): value is PlanId {
  return value === "intro" || value === "month" || value === "year";
}

function paypalBase() {
  return process.env.PAYPAL_ENV === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
}

export function paymentsConfigured() {
  return Boolean(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET);
}

export function paypalLive() {
  return process.env.PAYPAL_ENV === "live";
}

export function publicOrigin(hostHeader: string | null, protoHeader: string | null) {
  const host = (hostHeader ?? "").split(",")[0]?.trim() ?? "";
  if (!host || /[\s/]/.test(host)) return null;
  const local = host.startsWith("localhost") || host.startsWith("127.0.0.1");
  const proto = (protoHeader ?? "").split(",")[0]?.trim();
  return `${local && proto === "http" ? "http" : "https"}://${host}`;
}

class PayPalTimeout extends Error {
  constructor() {
    super("PayPal took too long to answer. Try again.");
    this.name = "PayPalTimeout";
  }
}

async function paypalFetch(url: string, init: RequestInit) {
  try {
    return await fetch(url, { ...init, signal: AbortSignal.timeout(20_000) });
  } catch (error) {
    if (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")) {
      throw new PayPalTimeout();
    }
    throw error;
  }
}

function usd(cents: number) {
  return (cents / 100).toFixed(2);
}

async function paypalToken() {
  const id = process.env.PAYPAL_CLIENT_ID || "";
  const secret = process.env.PAYPAL_CLIENT_SECRET || "";
  const response = await paypalFetch(`${paypalBase()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const payload = (await response.json().catch(() => null)) as { access_token?: string } | null;
  if (!response.ok || !payload?.access_token) return null;
  return payload.access_token;
}

async function grantPaidPeriod(paymentId: string, plan: PlanId, amountCents: number) {
  const db = await getDb();
  const existing = await queryOne<{ id: string }>(db, "SELECT id FROM payments WHERE id = ?", [paymentId]);
  if (existing) return;

  const userId = (await getUser())?.id;
  if (!userId) return;
  const access = await getAccess(userId);
  if (plan === "intro" && access.introUsed) return;
  if (PLANS[plan].cents !== amountCents) return;

  const now = nowSec();
  const periodEnd = Math.max(now, access.paidUntil) + PLANS[plan].days * DAY;
  const tx = await db.transaction("write");
  try {
    await execute(
      tx,
      "INSERT INTO payments (id, user_id, amount, created_at, period_end) VALUES (?, ?, ?, ?, ?)",
      [paymentId, userId, amountCents, now, periodEnd],
    );
    await execute(
      tx,
      "INSERT INTO user_settings (user_id, key, value) VALUES (?, 'paid_until', ?) ON CONFLICT(user_id, key) DO UPDATE SET value = excluded.value",
      [userId, String(periodEnd)],
    );
    if (plan === "intro") {
      await execute(
        tx,
        "INSERT INTO user_settings (user_id, key, value) VALUES (?, 'intro_used', '1') ON CONFLICT(user_id, key) DO UPDATE SET value = '1'",
        [userId],
      );
    }
    const subscription = await queryOne<{ value: string }>(
      tx,
      "SELECT value FROM user_settings WHERE user_id = ? AND key = 'paypal_subscription'",
      [userId],
    );
    if (!subscription?.value) {
      await execute(
        tx,
        "INSERT INTO user_settings (user_id, key, value) VALUES (?, 'site_limit', '1') ON CONFLICT(user_id, key) DO UPDATE SET value = '1'",
        [userId],
      );
    }
    await tx.commit();
  } catch (error) {
    await tx.rollback();
    throw error;
  } finally {
    tx.close();
  }
  const label = plan === "intro" ? "First 30 days" : plan === "year" ? "1 year" : "30 days";
  await sendPurchaseReceipt({ userId, paymentId, amountCents, periodEnd, planName: label }).catch(() => undefined);
}

type PayPalOrder = {
  id?: string;
  status?: string;
  purchase_units?: {
    custom_id?: string;
    payments?: { captures?: { id?: string; status?: string; amount?: { currency_code?: string; value?: string } }[] };
  }[];
};

function paypalError(payload: { message?: string; details?: { description?: string }[] } | null, fallback: string) {
  return payload?.details?.[0]?.description || payload?.message || fallback;
}

function paypalRedirectHost(url: URL) {
  return (
    url.protocol === "https:" &&
    (url.hostname === "paypal.com" ||
      url.hostname === "www.paypal.com" ||
      url.hostname === "sandbox.paypal.com" ||
      url.hostname === "www.sandbox.paypal.com")
  );
}

export async function createPayPalCheckout(choice: CheckoutChoice) {
  try {
    return await startPayPalCheckout(choice);
  } catch (error) {
    if (error instanceof PayPalTimeout) return { error: error.message };
    throw error;
  }
}

async function startPayPalCheckout(choice: CheckoutChoice) {
  if (!paymentsConfigured()) {
    return { error: "Add PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET to .env.local, then restart the app." };
  }
  const token = await paypalToken();
  if (!token) return { error: "PayPal did not accept the client id and secret." };

  const access = await getAccess();
  const origin = await siteOrigin();
  if (!origin) return { error: "Could not determine the site address for checkout." };
  const discounted = !access.introUsed;
  if (choice === "sites10" || choice === "sites20") {
    return createMonthlySubscription(token, choice, origin, discounted);
  }
  return createMonthlySubscription(token, discounted ? "intro" : "month", origin, discounted);
}

export async function capturePayPalOrder(orderId: string) {
  try {
    return await capturePayPalOrderInner(orderId);
  } catch (error) {
    if (error instanceof PayPalTimeout) return { ok: false as const, error: error.message };
    throw error;
  }
}

async function capturePayPalOrderInner(orderId: string) {
  if (!/^[A-Za-z0-9]+$/.test(orderId)) return { ok: false as const, error: "Unknown PayPal payment." };
  const checkout = await queryOne<{ plan: string; amount: number }>(
    await getDb(),
    "SELECT plan, amount FROM checkouts WHERE id = ?",
    [orderId],
  );
  if (!checkout || !isPlan(checkout.plan)) return { ok: false as const, error: "This PayPal payment is not for AnodeH." };

  const token = await paypalToken();
  if (!token) return { ok: false as const, error: "PayPal did not accept the client id and secret." };

  let response = await paypalFetch(`${paypalBase()}/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "PayPal-Request-Id": orderId,
    },
  });
  if (response.status === 422) {
    response = await paypalFetch(`${paypalBase()}/v2/checkout/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }
  const order = (await response.json().catch(() => null)) as PayPalOrder | null;
  const capture = order?.purchase_units?.[0]?.payments?.captures?.find((item) => item.status === "COMPLETED");
  const paidCents = Math.round(Number(capture?.amount?.value) * 100);
  if (order?.status !== "COMPLETED" || !capture?.id || capture.amount?.currency_code !== "USD" || paidCents !== checkout.amount) {
    return { ok: false as const, error: "PayPal has not confirmed this payment." };
  }
  if (order.purchase_units?.[0]?.custom_id && order.purchase_units[0].custom_id !== checkout.plan) {
    return { ok: false as const, error: "PayPal payment does not match the selected plan." };
  }
  await grantPaidPeriod(capture.id, checkout.plan, checkout.amount);
  return { ok: true as const, transactionId: capture.id };
}

async function siteOrigin() {
  const h = await headers();
  return publicOrigin(h.get("x-forwarded-host") ?? h.get("host"), h.get("x-forwarded-proto"));
}

function paypalMode() {
  return paypalLive() ? "live" : "sandbox";
}

async function paypalJson(token: string, path: string, body: unknown) {
  const response = await paypalFetch(`${paypalBase()}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(body),
  });
  const payload = (await response.json().catch(() => null)) as {
    id?: string;
    message?: string;
    details?: { description?: string }[];
    links?: { href?: string; rel?: string }[];
  } | null;
  return { ok: response.ok, payload };
}

async function paypalProductId(token: string) {
  const key = `paypal_product_${paypalMode()}`;
  const existing = await setting(key);
  if (existing) return existing;
  const created = await paypalJson(token, "/v1/catalogs/products", {
    name: "AnodeH",
    type: "SERVICE",
    category: "SOFTWARE",
  });
  if (!created.ok || !created.payload?.id) return null;
  await saveSetting(key, created.payload.id);
  return created.payload.id;
}

export type PaypalBillingCycle = {
  frequency: { interval_unit: "DAY"; interval_count: number };
  tenure_type: "TRIAL" | "REGULAR";
  sequence: number;
  total_cycles: number;
  pricing_scheme?: { fixed_price: { value: string; currency_code: string } };
};

export function subscriptionCycles(options: {
  fullCents: number;
  introCents: number;
  introDays: number;
  discounted: boolean;
}): PaypalBillingCycle[] {
  const regular: PaypalBillingCycle = {
    frequency: { interval_unit: "DAY", interval_count: PERIOD_DAYS },
    tenure_type: "REGULAR",
    sequence: options.discounted ? 2 : 1,
    total_cycles: 0,
    pricing_scheme: { fixed_price: { value: usd(options.fullCents), currency_code: "USD" } },
  };
  if (!options.discounted) return [regular];
  // PayPal: a free trial cycle does not require pricing_scheme. Sending value "0.00"
  // can leave the approve page spinning on genericError/RETRY.
  const trial: PaypalBillingCycle = {
    frequency: { interval_unit: "DAY", interval_count: options.introDays },
    tenure_type: "TRIAL",
    sequence: 1,
    total_cycles: 1,
    ...(options.introCents > 0
      ? { pricing_scheme: { fixed_price: { value: usd(options.introCents), currency_code: "USD" } } }
      : {}),
  };
  return [trial, regular];
}

export type PaypalPackageId = "month" | "sites10" | "sites20";

/** Free $0 intro cycles must not require an immediate PayPal capture. */
export function paypalPayeePreferred(introCents: number, discounted: boolean) {
  return discounted && introCents <= 0 ? "UNRESTRICTED" : "IMMEDIATE_PAYMENT_REQUIRED";
}

/** PayPal billing plan shapes for each AnodeH package (intro and full). */
export function paypalPackagePlans(discounted: boolean) {
  return {
    month: {
      // v3 recreates the free-trial plan without a $0 pricing_scheme (PayPal approve UI).
      keyName: discounted ? "trial7_v3" : "month",
      name: discounted ? "AnodeH 1 website - 7 day free trial" : "AnodeH monthly",
      sites: 1 as const,
      fullCents: STANDARD_CENTS,
      introCents: TRIAL_CENTS,
      introDays: TRIAL_DAYS,
      cycles: subscriptionCycles({
        fullCents: STANDARD_CENTS,
        introCents: TRIAL_CENTS,
        introDays: TRIAL_DAYS,
        discounted,
      }),
    },
    sites10: {
      keyName: discounted ? "sites10_half30" : "sites10_full",
      name: "AnodeH 10 websites",
      sites: 10 as const,
      fullCents: SITES_10_CENTS,
      introCents: SITES_10_INTRO_CENTS,
      introDays: PERIOD_DAYS,
      cycles: subscriptionCycles({
        fullCents: SITES_10_CENTS,
        introCents: SITES_10_INTRO_CENTS,
        introDays: PERIOD_DAYS,
        discounted,
      }),
    },
    sites20: {
      keyName: discounted ? "sites20_half30" : "sites20_full",
      name: "AnodeH 20 websites",
      sites: 20 as const,
      fullCents: SITES_20_CENTS,
      introCents: SITES_20_INTRO_CENTS,
      introDays: PERIOD_DAYS,
      cycles: subscriptionCycles({
        fullCents: SITES_20_CENTS,
        introCents: SITES_20_INTRO_CENTS,
        introDays: PERIOD_DAYS,
        discounted,
      }),
    },
  } satisfies Record<PaypalPackageId, unknown>;
}

async function pricedPlanId(
  token: string,
  keyName: string,
  name: string,
  fullCents: number,
  introCents: number,
  discounted: boolean,
  introDays = PERIOD_DAYS,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const key = `paypal_plan_${keyName}_${paypalMode()}`;
  const existing = await setting(key);
  if (existing) return { ok: true, id: existing };
  const productId = await paypalProductId(token);
  if (!productId) {
    return { ok: false, error: "PayPal could not prepare the product catalog entry for this plan." };
  }
  const cycles = subscriptionCycles({ fullCents, introCents, introDays, discounted });
  const created = await paypalJson(token, "/v1/billing/plans", {
    product_id: productId,
    name,
    status: "ACTIVE",
    billing_cycles: cycles,
    payment_preferences: {
      auto_bill_outstanding: true,
      payment_failure_threshold: 2,
    },
  });
  if (!created.ok || !created.payload?.id) {
    return {
      ok: false,
      error: paypalError(created.payload, "PayPal could not prepare the monthly plan."),
    };
  }
  await saveSetting(key, created.payload.id);
  return { ok: true, id: created.payload.id };
}

async function createMonthlySubscription(
  token: string,
  plan: "intro" | "month" | "sites10" | "sites20",
  origin: string,
  discounted: boolean,
) {
  const current = await setting("paypal_subscription");
  if (current) {
    const state = await applySubscription(current);
    if (state.active) return { error: "This account already renews automatically on PayPal." };
  }

  const packageKey: PaypalPackageId = plan === "sites20" || plan === "sites10" ? plan : "month";
  const pack = paypalPackagePlans(discounted)[packageKey];
  const prepared = await pricedPlanId(
    token,
    pack.keyName,
    pack.name,
    pack.fullCents,
    pack.introCents,
    discounted,
    pack.introDays,
  );
  if (!prepared.ok) return { error: prepared.error };

  const buyer = await getUser();
  const given = (buyer?.name || "Customer").trim().split(/\s+/)[0] || "Customer";
  const surname = (buyer?.name || "").trim().split(/\s+/).slice(1).join(" ") || "Account";
  const created = await paypalJson(token, "/v1/billing/subscriptions", {
    plan_id: prepared.id,
    custom_id: plan,
    ...(buyer?.email
      ? {
          subscriber: {
            email_address: buyer.email,
            name: { given_name: given.slice(0, 140), surname: surname.slice(0, 140) },
          },
        }
      : {}),
    application_context: {
      brand_name: "AnodeH",
      locale: "en-US",
      shipping_preference: "NO_SHIPPING",
      user_action: "SUBSCRIBE_NOW",
      payment_method: {
        payer_selected: "PAYPAL",
        payee_preferred: paypalPayeePreferred(pack.introCents, discounted),
      },
      return_url: `${origin}/billing`,
      cancel_url: `${origin}/`,
    },
  });
  const approve = created.payload?.links?.find((link) => link.rel === "approve")?.href;
  if (!created.ok || !created.payload?.id || !approve) {
    return { error: paypalError(created.payload, "PayPal could not start the monthly subscription.") };
  }
  const redirectUrl = new URL(approve);
  if (!paypalRedirectHost(redirectUrl)) return { error: "PayPal returned an unexpected payment link." };
  return { url: approve };
}

type PayPalSubscription = {
  id?: string;
  status?: string;
  custom_id?: string;
  start_time?: string;
  create_time?: string;
  billing_info?: {
    next_billing_time?: string;
    last_payment?: { time?: string; amount?: { currency_code?: string; value?: string } };
  };
};

function isoToSec(value?: string) {
  if (!value) return 0;
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? Math.floor(ms / 1000) : 0;
}

/** Access end timestamp for a PayPal subscription snapshot. */
export function subscriptionPeriodEnd(options: {
  customId?: string;
  nextBilling: number;
  paymentTime: number;
  paidCents: number;
  startTime: number;
  now: number;
}) {
  const unpaid = !options.paidCents || options.paidCents <= 0;
  const oneWebsiteTrial = unpaid && (options.customId === "intro" || options.customId === "month");
  if (oneWebsiteTrial) {
    const start = options.startTime > 0 ? options.startTime : options.now;
    return start + TRIAL_DAYS * DAY;
  }
  return options.nextBilling || (options.paymentTime > 0 && options.paidCents > 0 ? options.paymentTime + PERIOD_DAYS * DAY : 0);
}

async function applySubscription(
  id: string,
  userId?: string,
): Promise<{ ok: true; active: boolean; transactionId: string } | { ok: false; error: string; active: boolean }> {
  const token = await paypalToken();
  if (!token) return { ok: false, error: "PayPal did not accept the client id and secret.", active: false };

  const response = await paypalFetch(`${paypalBase()}/v1/billing/subscriptions/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const subscription = (await response.json().catch(() => null)) as PayPalSubscription | null;
  if (!response.ok || !subscription?.status) {
    return { ok: false, error: "PayPal could not confirm the subscription.", active: false };
  }
  const owner = userId || (await getUser())?.id;
  await saveSetting("paypal_synced_at", String(nowSec()), owner);

  const active = subscription.status === "ACTIVE";
  const payment = subscription.billing_info?.last_payment;
  const paidCents = payment ? Math.round(Number(payment.amount?.value) * 100) : 0;
  const knownAmount =
    !payment ||
    paidCents === 0 ||
    paidCents === INTRO_CENTS ||
    paidCents === STANDARD_CENTS ||
    paidCents === SITES_10_CENTS ||
    paidCents === SITES_10_INTRO_CENTS ||
    paidCents === SITES_20_CENTS ||
    paidCents === SITES_20_INTRO_CENTS;
  const nextBilling = isoToSec(subscription.billing_info?.next_billing_time);
  const startTime = isoToSec(subscription.start_time) || isoToSec(subscription.create_time);
  const now = nowSec();
  const periodEnd = subscriptionPeriodEnd({
    customId: subscription.custom_id,
    nextBilling,
    paymentTime: isoToSec(payment?.time),
    paidCents,
    startTime,
    now,
  });
  const currencyOk = !payment || payment.amount?.currency_code === "USD";
  if (!active || !currencyOk || !knownAmount || periodEnd <= now) {
    return {
      ok: false,
      active,
      error: active ? "PayPal has not started the subscription yet." : "The PayPal subscription is not active.",
    };
  }

  const currentPaid = Number((await setting("paid_until", owner)) || 0);
  const sites = sitesCovered(subscription.custom_id, paidCents);
  // During an unpaid 1-website trial, replace any inflated paid_until instead of keeping Math.max.
  const unpaidTrial = paidCents <= 0 && (subscription.custom_id === "intro" || subscription.custom_id === "month");
  const paidUntil = unpaidTrial ? periodEnd : Math.max(currentPaid, periodEnd);
  await saveSetting("paid_until", String(paidUntil), owner);
  await saveSetting("paypal_subscription", id, owner);
  await saveSetting("intro_used", "1", owner);
  await saveSetting("site_limit", String(sites), owner);
  if (!payment || paidCents <= 0) return { ok: true, active: true, transactionId: id };
  const paymentId = `${id}:${payment.time || periodEnd}`;
  const existingPayment = await queryOne<{ id: string }>(await getDb(), "SELECT id FROM payments WHERE id = ?", [paymentId]);
  await execute(
    await getDb(),
    "INSERT OR IGNORE INTO payments (id, user_id, amount, created_at, period_end) VALUES (?, ?, ?, ?, ?)",
    [paymentId, owner || "", paidCents, nowSec(), periodEnd],
  );
  if (!existingPayment && owner) {
    const firstMonth = paidCents === INTRO_CENTS || paidCents === SITES_10_INTRO_CENTS || paidCents === SITES_20_INTRO_CENTS;
    const label = firstMonth ? "First 30 days" : sites === 10 ? "10 websites" : sites === 20 ? "20 websites" : "30 days";
    await sendPurchaseReceipt({
      userId: owner,
      paymentId,
      amountCents: paidCents,
      periodEnd,
      planName: label,
    }).catch(() => undefined);
  }
  return { ok: true, active: true, transactionId: paymentId };
}

export async function confirmPayPalSubscription(subscriptionId: string) {
  if (!/^I-[A-Za-z0-9]+$/.test(subscriptionId)) {
    return { ok: false as const, error: "Unknown PayPal subscription." };
  }
  try {
    const result = await applySubscription(subscriptionId);
    if (!result.ok) return { ok: false as const, error: result.error };
    return { ok: true as const, transactionId: result.transactionId };
  } catch (error) {
    if (error instanceof PayPalTimeout) return { ok: false as const, error: error.message };
    throw error;
  }
}

export async function syncPayPalSubscription(userId?: string) {
  if (!paymentsConfigured()) return;
  const id = await setting("paypal_subscription", userId);
  if (!id) return;
  const synced = Number((await setting("paypal_synced_at", userId)) || 0);
  const paidUntil = Number((await setting("paid_until", userId)) || 0);
  const now = nowSec();
  if (now - synced < 6 * 60 * 60 && paidUntil > now + 2 * DAY) return;
  try {
    await applySubscription(id, userId);
  } catch (error) {
    if (error instanceof PayPalTimeout) return;
    throw error;
  }
}
