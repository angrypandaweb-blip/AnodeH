import assert from "node:assert/strict";
import { createClient } from "@libsql/client";
import { googleClickPriceExpr } from "../src/lib/google-cost.ts";

const db = createClient({ url: ":memory:" });
const day = "2026-11-11";
const ts = Math.floor(Date.parse(`${day}T12:00:00Z`) / 1000);
const price = googleClickPriceExpr("c");

await db.executeMultiple(`
  CREATE TABLE clicks (
    user_id TEXT NOT NULL,
    click_id TEXT NOT NULL,
    ip TEXT NOT NULL,
    placement TEXT NOT NULL,
    action TEXT NOT NULL,
    cost REAL NOT NULL,
    ts INTEGER NOT NULL
  );
  CREATE TABLE google_daily (
    user_id TEXT NOT NULL,
    day TEXT NOT NULL,
    campaign TEXT NOT NULL,
    clicks INTEGER NOT NULL,
    cost_micros INTEGER NOT NULL
  );
  CREATE TABLE google_clicks (
    user_id TEXT NOT NULL,
    gclid TEXT NOT NULL,
    ts INTEGER NOT NULL,
    campaign TEXT NOT NULL
  );
`);

await db.execute({
  sql: "INSERT INTO google_daily (user_id, day, campaign, clicks, cost_micros) VALUES ('u', ?, 'Brand', 4, 5000000)",
  args: [day],
});
await db.execute({
  sql: "INSERT INTO google_clicks (user_id, gclid, ts, campaign) VALUES ('u', 'g1', ?, 'Brand'), ('u', 'g2', ?, 'Brand'), ('u', 'g3', ?, 'Brand'), ('u', '', ?, 'Brand')",
  args: [ts, ts, ts, ts],
});
await db.execute({
  sql: `INSERT INTO clicks (user_id, click_id, ip, placement, action, cost, ts) VALUES
    ('u', 'g1', '1.2.3.4', 'site.example', 'block', 9.99, ?),
    ('u', 'g2', '1.2.3.4', 'site.example', 'flag', 9.99, ?),
    ('u', 'g3', '5.6.7.8', 'other.example', 'block', 1.5, ?),
    ('u', '', '5.6.7.8', 'other.example', 'allow', 1.5, ?)`,
  args: [ts, ts, ts, ts],
});

const ips = await db.execute(
  `SELECT c.ip AS ip, COUNT(*) AS clicks, SUM(${price}) AS google_cost,
     SUM(CASE WHEN ${price} IS NOT NULL THEN 1 ELSE 0 END) AS priced_clicks
   FROM clicks c GROUP BY c.ip ORDER BY c.ip`,
);
const byIp = Object.fromEntries(ips.rows.map((row) => [row.ip, row]));
assert.equal(byIp["1.2.3.4"].clicks, 2);
assert.equal(byIp["1.2.3.4"].priced_clicks, 2);
assert.equal(byIp["1.2.3.4"].google_cost, 2.5);
assert.equal(byIp["5.6.7.8"].clicks, 2);
assert.equal(byIp["5.6.7.8"].priced_clicks, 1);
assert.equal(byIp["5.6.7.8"].google_cost, 1.25);

const placements = await db.execute(
  `SELECT c.placement AS placement, COUNT(*) AS clicks, SUM(${price}) AS google_cost,
     SUM(CASE WHEN ${price} IS NOT NULL THEN 1 ELSE 0 END) AS priced_clicks
   FROM clicks c GROUP BY c.placement ORDER BY c.placement`,
);
const byPlacement = Object.fromEntries(placements.rows.map((row) => [row.placement, row]));
assert.equal(byPlacement["site.example"].priced_clicks, 2);
assert.equal(byPlacement["site.example"].google_cost, 2.5);
assert.equal(byPlacement["other.example"].priced_clicks, 1);
assert.notEqual(byPlacement["other.example"].priced_clicks, byPlacement["other.example"].clicks);
