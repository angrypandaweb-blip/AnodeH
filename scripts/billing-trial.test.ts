import assert from "node:assert/strict";
import { PERIOD_DAYS, STANDARD_CENTS, TRIAL_CENTS, TRIAL_DAYS, subscriptionCycles } from "../src/lib/billing";

const trial = subscriptionCycles({
  fullCents: STANDARD_CENTS,
  introCents: TRIAL_CENTS,
  introDays: TRIAL_DAYS,
  discounted: true,
});
assert.equal(trial.length, 2);
assert.equal(trial[0].tenure_type, "TRIAL");
assert.equal(trial[0].frequency.interval_count, TRIAL_DAYS);
assert.equal(trial[0].pricing_scheme.fixed_price.value, "0.00");
assert.equal(trial[1].tenure_type, "REGULAR");
assert.equal(trial[1].frequency.interval_count, PERIOD_DAYS);
assert.equal(trial[1].pricing_scheme.fixed_price.value, "69.00");

const full = subscriptionCycles({
  fullCents: STANDARD_CENTS,
  introCents: TRIAL_CENTS,
  introDays: TRIAL_DAYS,
  discounted: false,
});
assert.equal(full.length, 1);
assert.equal(full[0].tenure_type, "REGULAR");
assert.equal(full[0].sequence, 1);

console.log("billing trial tests passed");
