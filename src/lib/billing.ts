import { headers } from "next/headers";
import { execute, getDb, queryOne } from "@/lib/db";

export const PERIOD_DAYS = 30;
export const YEAR_DAYS = 365;
export const STANDARD_CENTS = 6900;
export const INTRO_CENTS = 3450;
export const ANNUAL_CENTS = 75900;

const DAY = 24 * 60 * 60;

export type AccessStatus = "active" | "unpaid";

export type Access = {
  status: AccessStatus;
  endsAt: number;
  daysLeft: number;
  paidUntil: number;
  introUsed: boolean;
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

async function setting(key: string) {
  const db = await getDb();
  const row = await queryOne<{ value: string }>(db, "SELECT value FROM settings WHERE key = ?", [key]);
  return row?.value;
}

async function saveSetting(key: string, value: string) {
  await execute(
    await getDb(),
    "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    [key, value],
  );
}

export async function getAccess(): Promise<Access> {
  await syncPayPalSubscription();
  const paidUntil = Number((await setting("paid_until")) || 0);
  const introUsed = (await setting("intro_used")) === "1";
  const now = nowSec();
  if (paidUntil > now) {
    return { status: "active", endsAt: paidUntil, daysLeft: daysLeft(paidUntil, now), paidUntil, introUsed };
  }
  return { status: "unpaid", endsAt: paidUntil, daysLeft: 0, paidUntil, introUsed };
}

export function planSummary(access: Access) {
  if (access.status === "active") {
    return { title: `Paid · ${dayPhrase(access.daysLeft)} left`, detail: `Through ${planDate(access.endsAt)}` };
  }
  if (access.introUsed) {
    return { title: "Plan unpaid", detail: `${dollars(STANDARD_CENTS)} / 30 days or ${dollars(ANNUAL_CENTS)}/year` };
  }
  return {
    title: `First 30 days · ${dollars(INTRO_CENTS)}`,
    detail: `Then ${dollars(STANDARD_CENTS)} or ${dollars(ANNUAL_CENTS)}/year`,
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

function usd(cents: number) {
  return (cents / 100).toFixed(2);
}

async function paypalToken() {
  const id = process.env.PAYPAL_CLIENT_ID || "";
  const secret = process.env.PAYPAL_CLIENT_SECRET || "";
  const response = await fetch(`${paypalBase()}/v1/oauth2/token`, {
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

  const access = await getAccess();
  if (plan === "intro" && access.introUsed) return;
  if (PLANS[plan].cents !== amountCents) return;

  const now = nowSec();
  const periodEnd = Math.max(now, access.paidUntil) + PLANS[plan].days * DAY;
  const tx = await db.transaction("write");
  try {
    await execute(
      tx,
      "INSERT INTO payments (id, amount, created_at, period_end) VALUES (?, ?, ?, ?)",
      [paymentId, amountCents, now, periodEnd],
    );
    await execute(
      tx,
      "INSERT INTO settings (key, value) VALUES ('paid_until', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
      [String(periodEnd)],
    );
    if (plan === "intro") {
      await execute(
        tx,
        "INSERT INTO settings (key, value) VALUES ('intro_used', '1') ON CONFLICT(key) DO UPDATE SET value = '1'",
      );
    }
    await tx.commit();
  } catch (error) {
    await tx.rollback();
    throw error;
  } finally {
    tx.close();
  }
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

export async function createPayPalCheckout(choice: "month" | "year") {
  if (!paymentsConfigured()) {
    return { error: "Add PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET to .env.local, then restart the app." };
  }
  const token = await paypalToken();
  if (!token) return { error: "PayPal did not accept the client id and secret." };

  const access = await getAccess();
  const plan: PlanId = choice === "year" ? "year" : access.introUsed ? "month" : "intro";
  if (plan !== "year") {
    const origin = await siteOrigin();
    if (!origin) return { error: "Could not determine the site address for checkout." };
    return createMonthlySubscription(token, plan, origin);
  }

  const spec = PLANS[plan];

  const origin = await siteOrigin();
  if (!origin) return { error: "Could not determine the site address for checkout." };

  const response = await fetch(`${paypalBase()}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          custom_id: plan,
          description: spec.name,
          amount: { currency_code: "USD", value: usd(spec.cents) },
        },
      ],
      application_context: {
        brand_name: "AnodeH",
        user_action: "PAY_NOW",
        shipping_preference: "NO_SHIPPING",
        return_url: `${origin}/billing`,
        cancel_url: `${origin}/billing?canceled=1`,
      },
    }),
  });
  const payload = (await response.json().catch(() => null)) as {
    id?: string;
    message?: string;
    details?: { description?: string }[];
    links?: { href?: string; rel?: string }[];
  } | null;
  const approve = payload?.links?.find((link) => link.rel === "approve" || link.rel === "payer-action")?.href;
  if (!response.ok || !payload?.id || !approve) {
    return { error: paypalError(payload, "PayPal could not start the payment.") };
  }

  const redirectUrl = new URL(approve);
  const allowed = redirectUrl.protocol === "https:" && (redirectUrl.hostname === "www.paypal.com" || redirectUrl.hostname === "www.sandbox.paypal.com");
  if (!allowed) return { error: "PayPal returned an unexpected payment link." };

  await execute(
    await getDb(),
    "INSERT INTO checkouts (id, plan, amount, created_at) VALUES (?, ?, ?, ?)",
    [payload.id, plan, spec.cents, nowSec()],
  );
  return { url: approve };
}

export async function capturePayPalOrder(orderId: string) {
  if (!/^[A-Za-z0-9]+$/.test(orderId)) return { ok: false as const, error: "Unknown PayPal payment." };
  const checkout = await queryOne<{ plan: string; amount: number }>(
    await getDb(),
    "SELECT plan, amount FROM checkouts WHERE id = ?",
    [orderId],
  );
  if (!checkout || !isPlan(checkout.plan)) return { ok: false as const, error: "This PayPal payment is not for AnodeH." };

  const token = await paypalToken();
  if (!token) return { ok: false as const, error: "PayPal did not accept the client id and secret." };

  let response = await fetch(`${paypalBase()}/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "PayPal-Request-Id": orderId,
    },
  });
  if (response.status === 422) {
    response = await fetch(`${paypalBase()}/v2/checkout/orders/${orderId}`, {
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
  return { ok: true as const };
}

async function siteOrigin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  return host ? `${proto}://${host}` : null;
}

function paypalMode() {
  return paypalLive() ? "live" : "sandbox";
}

async function paypalJson(token: string, path: string, body: unknown) {
  const response = await fetch(`${paypalBase()}${path}`, {
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

async function monthlyPlanId(token: string, intro: boolean) {
  const key = `paypal_plan_${intro ? "intro" : "month"}_${paypalMode()}`;
  const existing = await setting(key);
  if (existing) return existing;
  const productId = await paypalProductId(token);
  if (!productId) return null;

  const regular = {
    frequency: { interval_unit: "DAY", interval_count: PERIOD_DAYS },
    tenure_type: "REGULAR",
    sequence: intro ? 2 : 1,
    total_cycles: 0,
    pricing_scheme: { fixed_price: { value: usd(STANDARD_CENTS), currency_code: "USD" } },
  };
  const cycles = intro
    ? [
        {
          frequency: { interval_unit: "DAY", interval_count: PERIOD_DAYS },
          tenure_type: "TRIAL",
          sequence: 1,
          total_cycles: 1,
          pricing_scheme: { fixed_price: { value: usd(INTRO_CENTS), currency_code: "USD" } },
        },
        regular,
      ]
    : [regular];

  const created = await paypalJson(token, "/v1/billing/plans", {
    product_id: productId,
    name: intro ? "AnodeH monthly — first 30 days half off" : "AnodeH monthly",
    billing_cycles: cycles,
    payment_preferences: {
      auto_bill_outstanding: true,
      payment_failure_threshold: 2,
    },
  });
  if (!created.ok || !created.payload?.id) return null;
  await saveSetting(key, created.payload.id);
  return created.payload.id;
}

async function createMonthlySubscription(token: string, plan: "intro" | "month", origin: string) {
  const current = await setting("paypal_subscription");
  if (current) {
    const state = await applySubscription(current);
    if (state.active) return { error: "This workspace already renews automatically on PayPal." };
  }

  const planId = await monthlyPlanId(token, plan === "intro");
  if (!planId) return { error: "PayPal could not prepare the monthly plan." };

  const created = await paypalJson(token, "/v1/billing/subscriptions", {
    plan_id: planId,
    custom_id: plan,
    application_context: {
      brand_name: "AnodeH",
      shipping_preference: "NO_SHIPPING",
      user_action: "SUBSCRIBE_NOW",
      return_url: `${origin}/billing`,
      cancel_url: `${origin}/billing?canceled=1`,
    },
  });
  const approve = created.payload?.links?.find((link) => link.rel === "approve")?.href;
  if (!created.ok || !created.payload?.id || !approve) {
    return { error: paypalError(created.payload, "PayPal could not start the monthly subscription.") };
  }
  const redirectUrl = new URL(approve);
  const allowed = redirectUrl.protocol === "https:" && (redirectUrl.hostname === "www.paypal.com" || redirectUrl.hostname === "www.sandbox.paypal.com");
  if (!allowed) return { error: "PayPal returned an unexpected payment link." };
  return { url: approve };
}

type PayPalSubscription = {
  id?: string;
  status?: string;
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

async function applySubscription(id: string): Promise<{ ok: true; active: boolean } | { ok: false; error: string; active: boolean }> {
  const token = await paypalToken();
  if (!token) return { ok: false, error: "PayPal did not accept the client id and secret.", active: false };

  const response = await fetch(`${paypalBase()}/v1/billing/subscriptions/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const subscription = (await response.json().catch(() => null)) as PayPalSubscription | null;
  if (!response.ok || !subscription?.status) {
    return { ok: false, error: "PayPal could not confirm the subscription.", active: false };
  }
  await saveSetting("paypal_synced_at", String(nowSec()));

  const active = subscription.status === "ACTIVE";
  const payment = subscription.billing_info?.last_payment;
  const paidCents = Math.round(Number(payment?.amount?.value) * 100);
  const knownAmount = paidCents === INTRO_CENTS || paidCents === STANDARD_CENTS;
  const periodEnd = isoToSec(subscription.billing_info?.next_billing_time) || isoToSec(payment?.time) + PERIOD_DAYS * DAY;
  if (!active || payment?.amount?.currency_code !== "USD" || !knownAmount || periodEnd <= nowSec()) {
    return {
      ok: false,
      active,
      error: active ? "PayPal has not collected the monthly payment yet." : "The PayPal subscription is not active.",
    };
  }

  const currentPaid = Number((await setting("paid_until")) || 0);
  await saveSetting("paid_until", String(Math.max(currentPaid, periodEnd)));
  await saveSetting("paypal_subscription", id);
  if (paidCents === INTRO_CENTS) await saveSetting("intro_used", "1");
  const paymentId = `${id}:${payment?.time || periodEnd}`;
  await execute(
    await getDb(),
    "INSERT OR IGNORE INTO payments (id, amount, created_at, period_end) VALUES (?, ?, ?, ?)",
    [paymentId, paidCents, nowSec(), periodEnd],
  );
  return { ok: true, active: true };
}

export async function confirmPayPalSubscription(subscriptionId: string) {
  if (!/^I-[A-Za-z0-9]+$/.test(subscriptionId)) {
    return { ok: false as const, error: "Unknown PayPal subscription." };
  }
  const result = await applySubscription(subscriptionId);
  if (!result.ok) return { ok: false as const, error: result.error };
  return { ok: true as const };
}

export async function syncPayPalSubscription() {
  if (!paymentsConfigured()) return;
  const id = await setting("paypal_subscription");
  if (!id) return;
  const synced = Number((await setting("paypal_synced_at")) || 0);
  const paidUntil = Number((await setting("paid_until")) || 0);
  const now = nowSec();
  if (now - synced < 6 * 60 * 60 && paidUntil > now + 2 * DAY) return;
  await applySubscription(id);
}
