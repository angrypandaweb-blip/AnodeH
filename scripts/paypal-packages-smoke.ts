/**
 * Live PayPal smoke test for all AnodeH packages.
 * Requires PAYPAL_CLIENT_ID + PAYPAL_CLIENT_SECRET (sandbox preferred).
 * Creates product/plans and subscription approve links; does not capture payment.
 *
 * Usage: npx tsx scripts/paypal-packages-smoke.ts
 */
import {
  PERIOD_DAYS,
  paymentsConfigured,
  paypalLive,
  paypalPackagePlans,
  type PaypalPackageId,
} from "../src/lib/billing";

type TokenResponse = { access_token?: string };
type PaypalPayload = {
  id?: string;
  name?: string;
  status?: string;
  billing_cycles?: Array<{
    tenure_type?: string;
    frequency?: { interval_unit?: string; interval_count?: number };
    pricing_scheme?: { fixed_price?: { value?: string; currency_code?: string } };
  }>;
  links?: Array<{ rel?: string; href?: string }>;
  message?: string;
  details?: Array<{ description?: string }>;
};

const base = process.env.PAYPAL_ENV === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
const origin = process.env.SMOKE_ORIGIN || "https://anodeh.com";

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

async function token() {
  const id = process.env.PAYPAL_CLIENT_ID || "";
  const secret = process.env.PAYPAL_CLIENT_SECRET || "";
  const auth = Buffer.from(`${id}:${secret}`).toString("base64");
  const response = await fetch(`${base}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const payload = (await response.json().catch(() => null)) as TokenResponse | null;
  if (!response.ok || !payload?.access_token) fail(`PayPal auth failed (${response.status}).`);
  return payload.access_token;
}

async function paypal(access: string, path: string, body: unknown) {
  const response = await fetch(`${base}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${access}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(body),
  });
  const payload = (await response.json().catch(() => null)) as PaypalPayload | null;
  return { ok: response.ok, status: response.status, payload };
}

function describeCycles(cycles: PaypalPayload["billing_cycles"]) {
  return (cycles || [])
    .map((cycle) => {
      const price = cycle.pricing_scheme?.fixed_price?.value || "?";
      const days = cycle.frequency?.interval_count || "?";
      return `${cycle.tenure_type}@${days}d=$${price}`;
    })
    .join(" → ");
}

async function main() {
  if (!paymentsConfigured()) {
    fail("Set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET to run the live smoke test.");
  }
  console.log(`PayPal mode: ${paypalLive() ? "LIVE" : "sandbox"}`);
  if (paypalLive()) {
    console.log("Warning: live credentials will create real PayPal catalog objects.");
  }

  const access = await token();
  console.log("Auth: ok");

  const product = await paypal(access, "/v1/catalogs/products", {
    name: `AnodeH smoke ${Date.now()}`,
    type: "SERVICE",
    category: "SOFTWARE",
  });
  if (!product.ok || !product.payload?.id) {
    fail(`Product create failed: ${product.payload?.message || product.status}`);
  }
  console.log(`Product: ${product.payload.id}`);

  const packages = Object.keys(paypalPackagePlans(true)) as PaypalPackageId[];
  const results: Array<{ package: string; planId: string; cycles: string; approve: string }> = [];

  for (const id of packages) {
    const pack = paypalPackagePlans(true)[id];
    const created = await paypal(access, "/v1/billing/plans", {
      product_id: product.payload.id,
      name: `${pack.name} (smoke)`,
      status: "ACTIVE",
      billing_cycles: pack.cycles,
      payment_preferences: {
        auto_bill_outstanding: true,
        payment_failure_threshold: 2,
      },
    });
    if (!created.ok || !created.payload?.id) {
      fail(`${id} plan create failed: ${JSON.stringify(created.payload)}`);
    }

    const remoteCycles = describeCycles(created.payload.billing_cycles);
    const expectedIntro = pack.cycles[0]?.pricing_scheme?.fixed_price.value;
    const expectedRegular = pack.cycles[1]?.pricing_scheme?.fixed_price.value;
    const gotIntro = created.payload.billing_cycles?.[0]?.pricing_scheme?.fixed_price?.value;
    const gotRegular = created.payload.billing_cycles?.[1]?.pricing_scheme?.fixed_price?.value;
    // Free trials omit pricing_scheme; paid intros must still match.
    if (expectedIntro !== undefined && (gotIntro !== expectedIntro || gotRegular !== expectedRegular)) {
      fail(`${id} cycle mismatch. expected ${expectedIntro}/${expectedRegular}, got ${gotIntro}/${gotRegular}`);
    }
    if (expectedIntro === undefined && gotRegular !== expectedRegular) {
      fail(`${id} regular cycle mismatch. expected ${expectedRegular}, got ${gotRegular}`);
    }
    if (created.payload.billing_cycles?.[0]?.frequency?.interval_count !== pack.introDays) {
      fail(`${id} intro days mismatch.`);
    }
    if (created.payload.billing_cycles?.[1]?.frequency?.interval_count !== PERIOD_DAYS) {
      fail(`${id} regular days mismatch.`);
    }

    const sub = await paypal(access, "/v1/billing/subscriptions", {
      plan_id: created.payload.id,
      custom_id: id === "month" ? "intro" : id,
      application_context: {
        brand_name: "AnodeH",
        locale: "en-US",
        shipping_preference: "NO_SHIPPING",
        user_action: "SUBSCRIBE_NOW",
        return_url: `${origin}/billing`,
        cancel_url: `${origin}/`,
      },
    });
    const approve = sub.payload?.links?.find((link) => link.rel === "approve")?.href || "";
    if (!sub.ok || !sub.payload?.id || !approve) {
      fail(`${id} subscription create failed: ${JSON.stringify(sub.payload)}`);
    }
    if (!/^https:\/\/www\.(sandbox\.)?paypal\.com\//.test(approve)) {
      fail(`${id} unexpected approve host: ${approve}`);
    }

    results.push({ package: id, planId: created.payload.id, cycles: remoteCycles, approve });
    console.log(`${id}: plan ${created.payload.id} · ${remoteCycles} · approve ok`);
  }

  console.log(JSON.stringify({ ok: true, packages: results }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
