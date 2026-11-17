import assert from "node:assert/strict";
import { passwordResetLink, previousJohannesburgDay, signupNotice, supportRequestLetter, welcomeLetter } from "../src/lib/email-reports";

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

const notice = signupNotice({
  name: "Ada Lovelace",
  email: "ada@example.com",
  country: "ZA",
  createdAt: Math.floor(Date.parse("2026-11-17T07:30:00Z") / 1000),
});
assert.match(notice.subject, /Ada Lovelace/);
assert.match(notice.text, /ada@example.com/);
assert.match(notice.text, /South Africa/);
assert.match(notice.text, /17 Nov 2026, 09:30 SAST/);
assert.doesNotMatch(notice.text, /password_hash|secret-pass|cf_/i);
assert.doesNotMatch(notice.html, /password_hash|secret-pass/i);

const welcome = welcomeLetter({ name: "Ada Lovelace", domainKey: "cf_samplekey" });
assert.equal(welcome.subject, "Welcome to AnodeH");
assert.match(welcome.text, /Paste the site tag/);
assert.match(welcome.text, /<script src="https:\/\/anodeh.com\/cf.js" data-key="cf_samplekey" async><\/script>/);
assert.match(welcome.text, /support@anodeh.com/);
assert.match(welcome.text, /https:\/\/anodeh.com\/support/);
assert.doesNotMatch(welcome.text, /password/i);
assert.match(welcome.html, /support@anodeh.com/);
const sampleLetter = welcomeLetter({ name: "Sample customer", domainKey: "cf_sample" }, true);
assert.equal(sampleLetter.subject, "Sample: Welcome to AnodeH");
assert.match(sampleLetter.text, /sample of the welcome email/);

const request = supportRequestLetter({
  name: "Ada Lovelace",
  email: "ada@example.com",
  message: "The tag is not reporting visits.",
});
assert.match(request.subject, /Ada Lovelace/);
assert.match(request.text, /ada@example.com/);
assert.match(request.text, /The tag is not reporting visits/);
assert.match(request.html, /Reply to this message/);

console.log("email day tests passed");
