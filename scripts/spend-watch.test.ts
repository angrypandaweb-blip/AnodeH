import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { liveSpendWatch, sampleSpendWatch, slicesFromBreakdown } from "../src/lib/spend-watch";

const sample = sampleSpendWatch("$64");
assert.equal(sample.blockedTotal, 231);
assert.equal(sample.blockedSeries.length, 7);
assert.equal(sample.savedBars.length, 7);
assert.ok(sample.categories.some((slice) => slice.label === "Datacenter"));
assert.match(sample.savedTotalLabel, /\$64/);

const slices = slicesFromBreakdown([
  { reason: "datacenter", count: 10 },
  { reason: "vpn", count: 4 },
  { reason: "repeat_ip", count: 3 },
  { reason: "instant_bounce", count: 2 },
  { reason: "geo_mismatch", count: 1 },
  { reason: "bad_placement", count: 1 },
]);
assert.equal(slices.length, 5);
assert.equal(slices.at(-1)?.id, "other");
assert.equal(slices.at(-1)?.value, 2);

const empty = slicesFromBreakdown([]);
assert.equal(empty[0]?.id, "none");

const live = liveSpendWatch({
  series: [
    { ts: 1, allow: 10, organic: 1, flagged: 2, repeat: 1 },
    { ts: 2, allow: 8, organic: 0, flagged: 4, repeat: 0 },
    { ts: 3, allow: 12, organic: 2, flagged: 1, repeat: 2 },
    { ts: 4, allow: 9, organic: 0, flagged: 3, repeat: 1 },
  ],
  dayLabels: ["Mon", "Tue", "Wed", "Thu"],
  invalidTotal: 16,
  wasteLabel: "R1,200",
  wasteByDay: [10, 20, 15, 25],
  breakdown: [
    { reason: "datacenter", count: 8 },
    { reason: "vpn", count: 5 },
    { reason: "repeat_ip", count: 3 },
  ],
});
assert.equal(live.blockedLabel, "16");
assert.equal(live.blockedSeries[0]?.value, 4);
assert.equal(live.categories[0]?.id, "datacenter");
assert.match(live.blockedDelta, /%/);

const home = readFileSync("src/app/page.tsx", "utf8");
assert.match(home, /SpendWatchCharts/);
assert.match(home, /sampleSpendWatch/);

const dash = readFileSync("src/app/dashboard/page.tsx", "utf8");
assert.match(dash, /SpendWatchCharts/);
assert.match(dash, /invalidReasonBreakdown/);

const charts = readFileSync("src/components/SpendWatchCharts.tsx", "utf8");
assert.match(charts, /Blocked clicks by category/);
assert.match(charts, /DonutChart/);

const css = readFileSync("src/app/globals.css", "utf8");
assert.match(css, /\.watch-grid/);
assert.match(css, /\.watch-donut/);

console.log("spend-watch tests passed");
