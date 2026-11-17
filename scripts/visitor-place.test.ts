import assert from "node:assert/strict";
import { namedRegion, visitPlaceLabel } from "../src/lib/visitor-country";

assert.equal(namedRegion("ZA", "GP"), "Gauteng");
assert.equal(namedRegion("ZA", "KZN"), "KwaZulu-Natal");
assert.equal(namedRegion("US", "CA"), "");
assert.equal(visitPlaceLabel({ country: "ZA", city: "Johannesburg", region: "GP" }), "Johannesburg, South Africa");
assert.equal(visitPlaceLabel({ country: "ZA", city: "", region: "GP" }), "Gauteng, South Africa");
assert.equal(visitPlaceLabel({ country: "DE", city: "", region: "BE" }), "Germany");
assert.equal(visitPlaceLabel({ country: "", city: "", region: "" }), "");

console.log("visitor place tests passed");
