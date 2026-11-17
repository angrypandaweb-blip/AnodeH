import assert from "node:assert/strict";
import { coveredDomains } from "../src/lib/domain";
import { checkoutChoice, sitesCovered, storedSites } from "../src/lib/site-plans";

assert.deepEqual(coveredDomains("Example.com", undefined), ["example.com"]);
assert.deepEqual(coveredDomains("example.com", JSON.stringify(["example.com", "https://www.shop.co.za/x"])), [
  "example.com",
  "shop.co.za",
]);
assert.deepEqual(coveredDomains("not a domain", JSON.stringify(["one.test"])), ["one.test"]);
assert.deepEqual(coveredDomains("", "not-json"), []);

assert.equal(sitesCovered("sites10"), 10);
assert.equal(sitesCovered("sites20"), 20);
assert.equal(sitesCovered("month", 18900), 10);
assert.equal(sitesCovered("year", 28900), 20);
assert.equal(sitesCovered("month", 6900), 1);
assert.equal(storedSites("10"), 10);
assert.equal(storedSites("20"), 20);
assert.equal(storedSites("1"), 1);
assert.equal(checkoutChoice("sites10"), "sites10");
assert.equal(checkoutChoice("sites20"), "sites20");
assert.equal(checkoutChoice("year"), "year");
assert.equal(checkoutChoice("nope"), "month");

console.log("site plan tests passed");
