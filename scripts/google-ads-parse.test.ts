import assert from "node:assert/strict";
import {
  accessibleCustomerIds,
  dayTimestamp,
  googleErrorMessage,
  isManagerAccount,
  mapChannel,
  parseCampaign,
  parseClick,
  parseDaily,
} from "../src/lib/google-ads-parse";

assert.deepEqual(accessibleCustomerIds(["customers/1234567890", "customers/1234567890", "nope", "customers/123"]), ["1234567890"]);
assert.equal(mapChannel("PERFORMANCE_MAX"), "pmax");
assert.equal(mapChannel("DISPLAY"), "display");
assert.equal(mapChannel("SOMETHING_NEW"), "other");

const campaign = parseCampaign({
  campaign: { id: "9988776655", name: "Brand Search", status: "ENABLED", advertisingChannelType: "SEARCH" },
});
assert.equal(campaign?.name, "Brand Search");
assert.equal(campaign?.channel, "search");
assert.equal(parseCampaign({ campaign: { id: "1" } }), null);

const daily = parseDaily({
  campaign: { name: "Brand Search" },
  segments: { date: "2026-11-11" },
  metrics: { clicks: "4", costMicros: "1250000" },
});
assert.deepEqual(daily, { day: "2026-11-11", campaign: "Brand Search", clicks: 4, costMicros: 1250000 });

const click = parseClick({
  clickView: { gclid: "abc", keywordInfo: { text: "tents" } },
  campaign: { id: "9988776655", name: "Brand Search" },
  adGroup: { name: "Exact" },
  segments: { date: "2026-11-11", device: "MOBILE" },
});
assert.equal(click?.gclid, "abc");
assert.equal(click?.keyword, "tents");
assert.equal(click?.device, "MOBILE");
assert.equal(parseClick({ clickView: { gclid: "" }, segments: { date: "2026-11-11" } }), null);

assert.equal(isManagerAccount({ customer: { manager: true } }), true);
assert.equal(isManagerAccount({ customer: { manager: false } }), false);
assert.equal(googleErrorMessage({ error: { message: "outer", details: [{ errors: [{ message: "inner" }] }] } }, "fallback"), "inner");
assert.equal(dayTimestamp("2026-11-11"), Math.floor(Date.parse("2026-11-11T12:00:00Z") / 1000));

console.log("google ads parse tests passed");
