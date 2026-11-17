import assert from "node:assert/strict";
import { trackedDomain } from "../src/lib/domain";

assert.equal(trackedDomain("Example.com"), "example.com");
assert.equal(trackedDomain("https://www.Shop.example.co.za/path"), "shop.example.co.za");
assert.equal(trackedDomain("example.com:443"), "example.com");
assert.equal(trackedDomain("not a domain"), "");
assert.equal(trackedDomain("localhost"), "");

console.log("domain tests passed");
