import assert from "node:assert/strict";
import { recaptchaMode, recaptchaPassed } from "../src/lib/recaptcha";

assert.equal(recaptchaMode("", ""), "off");
assert.equal(recaptchaMode("site", "secret"), "on");
assert.equal(recaptchaMode("site", ""), "broken");
assert.equal(recaptchaMode("", "secret"), "broken");
assert.equal(recaptchaPassed({ success: true }), true);
assert.equal(recaptchaPassed({ success: false }), false);
assert.equal(recaptchaPassed(null), false);

console.log("recaptcha tests passed");
