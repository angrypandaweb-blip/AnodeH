import assert from "node:assert/strict";
import {
  PERIOD_DAYS,
  SITES_10_CENTS,
  SITES_10_INTRO_CENTS,
  SITES_20_CENTS,
  SITES_20_INTRO_CENTS,
  STANDARD_CENTS,
  TRIAL_CENTS,
  TRIAL_DAYS,
  paypalPackagePlans,
} from "../src/lib/billing";
import { checkoutChoice, sitesCovered } from "../src/lib/site-plans";

const intro = paypalPackagePlans(true);
const full = paypalPackagePlans(false);

assert.equal(checkoutChoice("month"), "month");
assert.equal(checkoutChoice("sites10"), "sites10");
assert.equal(checkoutChoice("sites20"), "sites20");

// 1 website — 7-day free trial then $69
assert.equal(intro.month.keyName, "trial7_v2");
assert.equal(intro.month.sites, 1);
assert.equal(intro.month.cycles.length, 2);
assert.equal(intro.month.cycles[0].tenure_type, "TRIAL");
assert.equal(intro.month.cycles[0].frequency.interval_count, TRIAL_DAYS);
assert.equal(intro.month.cycles[0].pricing_scheme.fixed_price.value, "0.00");
assert.equal(intro.month.cycles[1].tenure_type, "REGULAR");
assert.equal(intro.month.cycles[1].pricing_scheme.fixed_price.value, "69.00");
assert.equal(intro.month.fullCents, STANDARD_CENTS);
assert.equal(intro.month.introCents, TRIAL_CENTS);
assert.equal(sitesCovered("month", STANDARD_CENTS), 1);
assert.equal(sitesCovered("intro", TRIAL_CENTS), 1);

assert.equal(full.month.keyName, "month");
assert.equal(full.month.cycles.length, 1);
assert.equal(full.month.cycles[0].tenure_type, "REGULAR");
assert.equal(full.month.cycles[0].pricing_scheme.fixed_price.value, "69.00");

// 10 websites — half price first 30 days then $189
assert.equal(intro.sites10.keyName, "sites10_half30");
assert.equal(intro.sites10.sites, 10);
assert.equal(intro.sites10.cycles.length, 2);
assert.equal(intro.sites10.cycles[0].tenure_type, "TRIAL");
assert.equal(intro.sites10.cycles[0].frequency.interval_count, PERIOD_DAYS);
assert.equal(intro.sites10.cycles[0].pricing_scheme.fixed_price.value, "94.50");
assert.equal(intro.sites10.cycles[1].pricing_scheme.fixed_price.value, "189.00");
assert.equal(intro.sites10.fullCents, SITES_10_CENTS);
assert.equal(intro.sites10.introCents, SITES_10_INTRO_CENTS);
assert.equal(sitesCovered("sites10", SITES_10_INTRO_CENTS), 10);
assert.equal(sitesCovered("sites10", SITES_10_CENTS), 10);

assert.equal(full.sites10.keyName, "sites10_full");
assert.equal(full.sites10.cycles.length, 1);
assert.equal(full.sites10.cycles[0].pricing_scheme.fixed_price.value, "189.00");

// 20 websites — half price first 30 days then $289
assert.equal(intro.sites20.keyName, "sites20_half30");
assert.equal(intro.sites20.sites, 20);
assert.equal(intro.sites20.cycles.length, 2);
assert.equal(intro.sites20.cycles[0].tenure_type, "TRIAL");
assert.equal(intro.sites20.cycles[0].frequency.interval_count, PERIOD_DAYS);
assert.equal(intro.sites20.cycles[0].pricing_scheme.fixed_price.value, "144.50");
assert.equal(intro.sites20.cycles[1].pricing_scheme.fixed_price.value, "289.00");
assert.equal(intro.sites20.fullCents, SITES_20_CENTS);
assert.equal(intro.sites20.introCents, SITES_20_INTRO_CENTS);
assert.equal(sitesCovered("sites20", SITES_20_INTRO_CENTS), 20);
assert.equal(sitesCovered("sites20", SITES_20_CENTS), 20);

assert.equal(full.sites20.keyName, "sites20_full");
assert.equal(full.sites20.cycles.length, 1);
assert.equal(full.sites20.cycles[0].pricing_scheme.fixed_price.value, "289.00");

// Every package exposes a REGULAR cycle that never ends (total_cycles 0)
for (const pack of [intro.month, intro.sites10, intro.sites20, full.month, full.sites10, full.sites20]) {
  const regular = pack.cycles.find((cycle) => cycle.tenure_type === "REGULAR");
  assert.ok(regular, pack.keyName);
  assert.equal(regular.total_cycles, 0);
  assert.equal(regular.frequency.interval_count, PERIOD_DAYS);
  assert.equal(regular.pricing_scheme.fixed_price.currency_code, "USD");
}

console.log("paypal package tests passed");
