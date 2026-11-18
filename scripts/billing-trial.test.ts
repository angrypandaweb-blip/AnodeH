import assert from "node:assert/strict";
import {
  PERIOD_DAYS,
  STANDARD_CENTS,
  TRIAL_CENTS,
  TRIAL_DAYS,
  subscriptionCycles,
  subscriptionPeriodEnd,
} from "../src/lib/billing";

const DAY = 24 * 60 * 60;
const now = 1_700_000_000;

const trial = subscriptionCycles({
  fullCents: STANDARD_CENTS,
  introCents: TRIAL_CENTS,
  introDays: TRIAL_DAYS,
  discounted: true,
});
assert.equal(trial.length, 2);
assert.equal(trial[0].tenure_type, "TRIAL");
assert.equal(trial[0].frequency.interval_count, TRIAL_DAYS);
assert.equal("pricing_scheme" in trial[0], false);
assert.equal(trial[1].tenure_type, "REGULAR");
assert.equal(trial[1].frequency.interval_count, PERIOD_DAYS);
assert.equal(trial[1].pricing_scheme?.fixed_price.value, "69.00");

const paidIntro = subscriptionCycles({
  fullCents: STANDARD_CENTS,
  introCents: 3450,
  introDays: PERIOD_DAYS,
  discounted: true,
});
assert.equal(paidIntro[0]?.pricing_scheme?.fixed_price.value, "34.50");

const full = subscriptionCycles({
  fullCents: STANDARD_CENTS,
  introCents: TRIAL_CENTS,
  introDays: TRIAL_DAYS,
  discounted: false,
});
assert.equal(full.length, 1);
assert.equal(full[0].tenure_type, "REGULAR");
assert.equal(full[0].sequence, 1);

// Free 1-website trial must end after 7 days even if PayPal next_billing is inflated (e.g. 21 days).
const start = now;
const inflatedNext = now + 21 * DAY;
assert.equal(
  subscriptionPeriodEnd({
    customId: "intro",
    nextBilling: inflatedNext,
    paymentTime: 0,
    paidCents: 0,
    startTime: start,
    now,
  }),
  start + TRIAL_DAYS * DAY,
);
assert.equal(
  subscriptionPeriodEnd({
    customId: "month",
    nextBilling: inflatedNext,
    paymentTime: 0,
    paidCents: 0,
    startTime: start,
    now,
  }),
  start + TRIAL_DAYS * DAY,
);

// After the first real charge, trust PayPal's next billing time.
const paidNext = now + PERIOD_DAYS * DAY;
assert.equal(
  subscriptionPeriodEnd({
    customId: "intro",
    nextBilling: paidNext,
    paymentTime: now,
    paidCents: STANDARD_CENTS,
    startTime: start,
    now,
  }),
  paidNext,
);

console.log("billing trial tests passed");
