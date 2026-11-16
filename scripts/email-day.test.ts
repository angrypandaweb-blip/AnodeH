import assert from "node:assert/strict";
import { passwordResetLink, previousJohannesburgDay } from "../src/lib/email-reports";

assert.equal(
  passwordResetLink("anodeh.com", "https", "abc"),
  "https://anodeh.com/reset-password?token=abc",
);
assert.equal(
  passwordResetLink("evil.com/path", "http", "abc"),
  "https://anodeh.com/reset-password?token=abc",
);
assert.equal(
  passwordResetLink("localhost:3000", "http", "abc"),
  "http://localhost:3000/reset-password?token=abc",
);

const sample = Date.parse("2026-11-12T08:00:00Z");
const day = previousJohannesburgDay(sample);
assert.equal(day.key, "2026-11-11");
assert.equal(day.start, Math.floor(Date.parse("2026-11-11T00:00:00+02:00") / 1000));
assert.equal(day.end, Math.floor(Date.parse("2026-11-12T00:00:00+02:00") / 1000));
assert.equal(day.label, "11 Nov 2026");
console.log("email day tests passed");
