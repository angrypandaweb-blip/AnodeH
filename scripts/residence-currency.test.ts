import assert from "node:assert/strict";
import { convertUsdCents, countryFromEmail, currencyForCountry, formatMoney, placeFor } from "../src/lib/residence-currency";

assert.equal(placeFor("ZA", "owner@gmail.com").currency, "ZAR");
assert.equal(placeFor("ZA", "owner@gmail.com").timeZone, "Africa/Johannesburg");
assert.equal(placeFor("", "info@haggies.co.za").currency, "ZAR");
assert.equal(countryFromEmail("info@haggies.co.za"), "ZA");
assert.equal(currencyForCountry("ZA"), "ZAR");
assert.equal(countryFromEmail("owner@example.com"), "US");
assert.equal(currencyForCountry("US"), "USD");
assert.equal(countryFromEmail("owner@shop.co.uk"), "GB");
assert.equal(convertUsdCents(3450, 18), 621);
assert.match(formatMoney(convertUsdCents(3450, 18), "ZAR"), /621/);
assert.match(formatMoney(21, "ZAR"), /R/);
assert.match(formatMoney(21, "USD"), /\$/);
assert.equal(formatMoney(4180, "USD", 0), "$4,180");
assert.equal(formatMoney(Math.round(642 * 18), "ZAR", 0).replace(/\u00a0|\u202f/g, " "), "R 11 556");
console.log("residence currency tests passed");
