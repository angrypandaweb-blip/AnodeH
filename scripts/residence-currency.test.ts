import assert from "node:assert/strict";
import { countryFromEmail, currencyForCountry, formatMoney, placeFor } from "../src/lib/residence-currency";

assert.equal(placeFor("ZA", "owner@gmail.com").currency, "ZAR");
assert.equal(placeFor("ZA", "owner@gmail.com").timeZone, "Africa/Johannesburg");
assert.equal(placeFor("", "info@haggies.co.za").currency, "ZAR");
assert.equal(countryFromEmail("info@haggies.co.za"), "ZA");
assert.equal(currencyForCountry("ZA"), "ZAR");
assert.equal(countryFromEmail("owner@example.com"), "US");
assert.equal(currencyForCountry("US"), "USD");
assert.equal(countryFromEmail("owner@shop.co.uk"), "GB");
assert.match(formatMoney(21, "ZAR"), /R/);
assert.match(formatMoney(21, "USD"), /\$/);
console.log("residence currency tests passed");
