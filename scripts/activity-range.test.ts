import assert from "node:assert/strict";
import { activitySince } from "../src/lib/activity-range";

const sundayEvening = Date.parse("2026-11-15T20:00:00Z");
assert.equal(activitySince("day", sundayEvening), Math.floor(Date.parse("2026-11-15T00:00:00+02:00") / 1000));
assert.equal(activitySince("week", sundayEvening), Math.floor(Date.parse("2026-11-09T00:00:00+02:00") / 1000));
assert.equal(activitySince("month", sundayEvening), Math.floor(Date.parse("2026-11-01T00:00:00+02:00") / 1000));
assert.equal(activitySince("all", sundayEvening), null);

const mondayMorning = Date.parse("2026-11-16T04:30:00Z");
assert.equal(activitySince("day", mondayMorning), Math.floor(Date.parse("2026-11-16T00:00:00+02:00") / 1000));
assert.equal(activitySince("week", mondayMorning), Math.floor(Date.parse("2026-11-16T00:00:00+02:00") / 1000));

console.log("activity range tests passed");
