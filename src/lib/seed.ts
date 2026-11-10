import { type Db, execute, getDb, queryOne } from "./db";
import { recordClick, OFFICE_IP, COMPETITOR_IP, nid } from "./engine";
import type { IncomingClick, Network } from "./types";

function mulberry32(seed: number) {
  let state = seed;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rand: () => number, items: T[]): T {
  return items[Math.floor(rand() * items.length)];
}

const CITIES: Record<string, string[]> = {
  US: ["Austin", "Denver", "Portland", "Chicago", "Boise"],
  CA: ["Toronto", "Vancouver"],
  GB: ["Manchester"],
  NL: ["Amsterdam"],
  IN: ["Bengaluru"],
  NG: ["Lagos"],
  DE: ["Berlin"],
};

export async function resetDemo() {
  const db = await getDb();
  const tx = await db.transaction("write");
  try {
    await execute(tx, "DELETE FROM clicks");
    await execute(tx, "DELETE FROM blocks");
    await execute(tx, "DELETE FROM alerts");
    await execute(tx, "DELETE FROM allowlist");
    await seedIfEmpty(tx);
    await tx.commit();
  } catch (error) {
    await tx.rollback();
    throw error;
  } finally {
    tx.close();
  }
}

export async function seedIfEmpty(db: Db) {
  const count = await queryOne<{ c: number }>(db, "SELECT COUNT(*) AS c FROM clicks");
  if ((count?.c ?? 0) > 0) return;

  await execute(db, "INSERT OR IGNORE INTO allowlist (id, value, note) VALUES (?, ?, ?)", [
    "w_office",
    OFFICE_IP,
    "Northwind office",
  ]);

  const rand = mulberry32(20261104);
  const now = Math.floor(Date.now() / 1000);
  const events: IncomingClick[] = [];

  for (let i = 0; i < 340; i++) {
    const campaign = pick(rand, ["Brand — Exact", "Nonbrand — Hiking", "Performance Max", "Brand — Exact"]);
    const country = rand() > 0.08 ? "US" : pick(rand, ["US", "CA"]);
    const engaged = rand() > 0.12;
    events.push({
      campaign,
      keyword: campaign.startsWith("Brand") ? "northwind tents" : "ultralight backpack",
      ip: `98.${20 + Math.floor(rand() * 40)}.${Math.floor(rand() * 200)}.${1 + Math.floor(rand() * 240)}`,
      deviceHash: `dev-shop-${i}`,
      country,
      city: pick(rand, CITIES[country] ?? ["Austin"]),
      isp: pick(rand, ["Comcast", "Charter", "AT&T", "Verizon"]),
      network: "residential",
      timeOnPage: engaged ? 18 + Math.floor(rand() * 140) : 4 + Math.floor(rand() * 8),
      engaged,
      converted: engaged && rand() > 0.9,
      ts: now - Math.floor(rand() * 6.5 * 86400),
      userAgent: "Mozilla/5.0",
    });
  }

  for (let i = 0; i < 8; i++) {
    events.push({
      campaign: "Brand — Exact",
      keyword: "northwind tents",
      ip: COMPETITOR_IP,
      deviceHash: "dev-competitor-1",
      country: "US",
      city: "Denver",
      isp: "Comcast Business",
      network: "residential",
      timeOnPage: 0.6 + rand(),
      engaged: false,
      converted: false,
      ts: now - (6 - Math.floor(i / 2)) * 86400 + i * 400,
      userAgent: "Mozilla/5.0",
    });
  }

  for (let i = 0; i < 8; i++) {
    events.push({
      campaign: "Nonbrand — Hiking",
      keyword: "hiking backpack sale",
      ip: `34.201.14.${11 + i}`,
      deviceHash: `dev-aws-${i}`,
      country: "US",
      city: "Ashburn",
      isp: "Amazon Technologies",
      network: "datacenter",
      timeOnPage: 0.3,
      engaged: false,
      converted: false,
      ts: now - 86400 + i * 90,
      userAgent: "HeadlessChrome",
    });
  }

  for (let i = 0; i < 5; i++) {
    events.push({
      campaign: "Nonbrand — Hiking",
      ip: `146.70.10.${2 + i * 11}`,
      deviceHash: "dev-proxy-pool",
      country: "NL",
      city: "Amsterdam",
      isp: "NordVPN",
      network: "vpn",
      timeOnPage: 0.4,
      engaged: false,
      converted: false,
      ts: now - 2 * 86400 + i * 300,
      userAgent: "Mozilla/5.0",
    });
  }

  const junk = ["cheap-clicks.example", "movie-free.example", "prize-spin.example", "pdf-download.example"];
  for (let i = 0; i < 12; i++) {
    events.push({
      campaign: "Display — Prospecting",
      placement: junk[i % junk.length],
      ip: `68.${10 + (i % 8)}.${30 + i}.${40 + i}`,
      deviceHash: `dev-display-${i}`,
      country: i % 4 === 0 ? "IN" : "US",
      city: i % 4 === 0 ? "Bengaluru" : "Chicago",
      isp: "Charter",
      network: "residential",
      timeOnPage: 0.8,
      engaged: false,
      converted: false,
      ts: now - (i % 5) * 86400,
      userAgent: "Mozilla/5.0",
    });
  }

  for (let i = 0; i < 4; i++) {
    events.push({
      campaign: "Brand — Exact",
      keyword: "northwind",
      ip: OFFICE_IP,
      deviceHash: "dev-office",
      country: "US",
      city: "Boise",
      isp: "Ziply Fiber",
      network: "residential",
      timeOnPage: 1.1,
      engaged: false,
      converted: false,
      ts: now - 3600 * (i + 1),
      userAgent: "Mozilla/5.0",
    });
  }

  for (let i = 0; i < 6; i++) {
    events.push({
      campaign: "Performance Max",
      ip: `35.196.20.${15 + i}`,
      deviceHash: `dev-pmax-${i}`,
      country: "US",
      city: "Council Bluffs",
      isp: "Google Cloud",
      network: "datacenter",
      timeOnPage: 0.2,
      engaged: false,
      converted: false,
      ts: now - 3 * 86400 + i * 120,
      userAgent: "HeadlessChrome",
    });
  }

  events.sort((a, b) => (a.ts ?? 0) - (b.ts ?? 0));
  for (const event of events) await recordClick(db, event);
}

export async function simulateScenario(scenario: string): Promise<number> {
  const db = await getDb();
  const now = Math.floor(Date.now() / 1000);
  const made: IncomingClick[] = [];
  const rand = mulberry32(now % 100000);

  if (scenario === "shoppers") {
    for (let i = 0; i < 8; i++) {
      made.push({
        campaign: pick(rand, ["Brand — Exact", "Nonbrand — Hiking"]),
        keyword: "camping stove",
        ip: `24.15.${Math.floor(rand() * 40)}.${10 + i}`,
        deviceHash: nid("dev"),
        country: "US",
        city: "Portland",
        isp: "Comcast",
        network: "residential",
        timeOnPage: 25 + i,
        engaged: true,
        converted: i === 3,
        ts: now - (8 - i),
      });
    }
  } else if (scenario === "competitor") {
    for (let i = 0; i < 5; i++) {
      made.push({
        campaign: "Brand — Exact",
        keyword: "northwind tents",
        ip: COMPETITOR_IP,
        deviceHash: "dev-competitor-1",
        country: "US",
        city: "Denver",
        isp: "Comcast Business",
        network: "residential",
        timeOnPage: 0.5,
        engaged: false,
        converted: false,
        ts: now - (5 - i),
      });
    }
  } else if (scenario === "datacenter") {
    for (let i = 0; i < 6; i++) {
      made.push({
        campaign: "Nonbrand — Hiking",
        keyword: "hiking backpack sale",
        ip: `34.201.88.${20 + i}`,
        deviceHash: nid("dev"),
        country: "US",
        city: "Ashburn",
        isp: "Amazon Technologies",
        network: "datacenter" satisfies Network,
        timeOnPage: 0.2,
        engaged: false,
        converted: false,
        ts: now - (6 - i),
      });
    }
  } else if (scenario === "vpn") {
    for (let i = 0; i < 4; i++) {
      made.push({
        campaign: "Nonbrand — Hiking",
        ip: `185.220.101.${30 + i}`,
        deviceHash: "dev-proxy-pool",
        country: "DE",
        city: "Berlin",
        isp: "Mullvad",
        network: "vpn",
        timeOnPage: 0.3,
        engaged: false,
        converted: false,
        ts: now - (4 - i),
      });
    }
  }

  for (const event of made) await recordClick(db, event);
  return made.length;
}
