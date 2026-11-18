import assert from "node:assert/strict";
import { decryptSecret, encryptSecret } from "../src/lib/spam-mail";
import { evaluateSpam, extractLinks, reasonText } from "../src/lib/spam-score";

const clean = evaluateSpam({
  from: "Alex <alex@example.com>",
  subject: "Invoice copy for last week",
  body: "Hi, here is the PDF we discussed on the call. Let me know if you need anything else.",
});
assert.equal(clean.action, "allow");
assert.ok(clean.score < 35, String(clean.score));

const phish = evaluateSpam({
  from: "PayPal Support <help@totally-random-domain.xyz>",
  replyTo: "attacker@evil.test",
  subject: "URGENT!!! Your account will be suspended",
  body: "Verify your account immediately and confirm your password here: http://bit.ly/paypal-login then send a gift card.",
});
assert.equal(phish.action, "block");
assert.ok(phish.score >= 65, String(phish.score));
assert.ok(phish.reasons.includes("brand_spoof"));
assert.ok(phish.reasons.includes("shortener_link"));
assert.ok(reasonText(phish.reasons).includes("Pretends to be a known brand"));

const links = extractLinks("See https://example.com/a and https://example.com/a again");
assert.deepEqual(links, ["https://example.com/a"]);

process.env.SPAM_MAILBOX_SECRET = "test-secret-for-spam";
const secret = encryptSecret("app-password-value");
assert.notEqual(secret, "app-password-value");
assert.equal(decryptSecret(secret), "app-password-value");

console.log("spam-score tests passed");
