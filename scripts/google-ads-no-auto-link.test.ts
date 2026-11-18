import assert from "node:assert/strict";
import { MISSING_ADS_ACCOUNT } from "../src/lib/google-ads";

assert.match(MISSING_ADS_ACCOUNT, /does not pick an account automatically/i);
assert.match(MISSING_ADS_ACCOUNT, /Settings/);

console.log("google ads no-auto-link tests passed");
