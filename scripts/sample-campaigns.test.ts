import assert from "node:assert/strict";
import { sampleCampaigns } from "../src/lib/sample-campaigns";

const nl = sampleCampaigns("NL");
assert.equal(nl[0].name, "Tulips — Spring");
assert.equal(nl[2].keyword, "gouda cheese market");

const za = sampleCampaigns("ZA");
assert.equal(za[0].name, "Safari — Kruger");
assert.equal(za[1].name, "Table Mountain");

const us = sampleCampaigns("US");
assert.equal(us[1].keyword, "baseball tickets");

const fallback = sampleCampaigns("");
assert.equal(fallback.length, 3);
assert.equal(fallback[0].name, "Parks — Family");

for (const code of ["NL", "ZA", "US", "JP", "DE", "BR", ""]) {
  const rows = sampleCampaigns(code);
  assert.equal(rows.length, 3);
  for (const row of rows) {
    assert.doesNotMatch(`${row.name} ${row.keyword}`, /wine|beer|casino|nightclub|adult/i);
  }
}

console.log("sample campaign tests passed");
