import assert from "node:assert/strict";
import { purchaseTransactionId } from "../src/lib/google-conversion";

assert.equal(purchaseTransactionId("5O190127TN364715T"), "5O190127TN364715T");
assert.equal(purchaseTransactionId("I-ABC123:1710000000"), "I-ABC123:1710000000");
assert.equal(purchaseTransactionId(""), "");
assert.equal(purchaseTransactionId("bad id"), "");
assert.equal(purchaseTransactionId("<script>"), "");

console.log("google conversion tests passed");
