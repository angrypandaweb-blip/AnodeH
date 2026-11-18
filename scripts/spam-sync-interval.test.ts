import assert from "node:assert/strict";
import { SPAM_SYNC_INTERVAL_SEC } from "../src/lib/spam-mail";

assert.equal(SPAM_SYNC_INTERVAL_SEC, 5 * 60);
assert.ok(SPAM_SYNC_INTERVAL_SEC >= 60);
assert.ok(SPAM_SYNC_INTERVAL_SEC <= 15 * 60);

console.log("spam sync interval tests passed");
