import assert from "node:assert/strict";
import { allowClickClauses, isAllowed } from "../src/lib/engine";

const values = ["203.0.113.10", "198.51.100.0/24", ""];
const filter = allowClickClauses("c.ip", values);
assert.deepEqual(filter.clauses, ["c.ip != ?", "c.ip NOT LIKE ?"]);
assert.deepEqual(filter.params, ["203.0.113.10", "198.51.100.%"]);

assert.equal(isAllowed("203.0.113.10", values), true);
assert.equal(isAllowed("198.51.100.44", values), true);
assert.equal(isAllowed("203.0.113.11", values), false);

console.log("allow click tests passed");
