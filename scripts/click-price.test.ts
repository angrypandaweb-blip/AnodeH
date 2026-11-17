import assert from "node:assert/strict";
import { clickPrice, monitoredFromAverage } from "../src/lib/click-price";

assert.equal(clickPrice("15.50"), 15.5);
assert.equal(clickPrice("R 15,50"), 15.5);
assert.equal(clickPrice("1500"), 1500);
assert.equal(clickPrice(""), null);
assert.equal(clickPrice("0"), null);
assert.equal(clickPrice("15.555"), null);
assert.deepEqual(monitoredFromAverage(10, 2, 15.5), { spend: 155, waste: 31 });

console.log("click price tests passed");
