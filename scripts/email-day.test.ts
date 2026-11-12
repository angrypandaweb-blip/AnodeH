import assert from "node:assert/strict";
import { previousJohannesburgDay } from "../src/lib/email-reports";

const sample = Date.parse("2026-11-12T08:00:00Z");
const day = previousJohannesburgDay(sample);
assert.equal(day.key, "2026-11-11");
assert.equal(day.start, Math.floor(Date.parse("2026-11-11T00:00:00+02:00") / 1000));
assert.equal(day.end, Math.floor(Date.parse("2026-11-12T00:00:00+02:00") / 1000));
assert.equal(day.label, "11 Nov 2026");
console.log("email day tests passed");
