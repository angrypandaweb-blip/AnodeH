import { createClient, type Client, type InArgs, type Transaction } from "@libsql/client";

export type Db = Client | Transaction;

const globalForDb = globalThis as unknown as { AnodeH?: Promise<Client> };
if (process.env.NODE_ENV !== "production") globalForDb.AnodeH = undefined;

export async function queryAll<T>(db: Db, sql: string, args: InArgs = []): Promise<T[]> {
  const result = await db.execute({ sql, args });
  return result.rows as unknown as T[];
}

export async function queryOne<T>(db: Db, sql: string, args: InArgs = []): Promise<T | undefined> {
  const rows = await queryAll<T>(db, sql, args);
  return rows[0];
}

export async function execute(db: Db, sql: string, args: InArgs = []): Promise<void> {
  await db.execute({ sql, args });
}

function isTransientFetchError(error: unknown) {
  if (!(error instanceof Error)) return false;
  const cause = error.cause as { code?: string } | undefined;
  return (
    error.message === "fetch failed" ||
    cause?.code === "UND_ERR_SOCKET" ||
    cause?.code === "ECONNRESET" ||
    cause?.code === "ETIMEDOUT"
  );
}

async function fetchWithRetry(input: RequestInfo | URL, init?: RequestInit) {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await fetch(input, init);
    } catch (error) {
      lastError = error;
      if (attempt === 2 || !isTransientFetchError(error)) throw error;
      await new Promise((resolve) => setTimeout(resolve, 400 * (attempt + 1)));
    }
  }
  throw lastError;
}

function createTurso(): Client {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url) throw new Error("TURSO_DATABASE_URL is not set");
  if (!authToken) throw new Error("TURSO_AUTH_TOKEN is not set");
  return createClient({ url, authToken, intMode: "number", fetch: fetchWithRetry });
}

async function migrate(db: Client) {
  await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS allowlist (
      id TEXT PRIMARY KEY,
      value TEXT NOT NULL UNIQUE,
      note TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS clicks (
      id TEXT PRIMARY KEY,
      ts INTEGER NOT NULL,
      click_id TEXT NOT NULL,
      campaign TEXT NOT NULL,
      campaign_type TEXT NOT NULL,
      keyword TEXT NOT NULL,
      placement TEXT NOT NULL,
      ip TEXT NOT NULL,
      device_hash TEXT NOT NULL,
      country TEXT NOT NULL,
      city TEXT NOT NULL,
      isp TEXT NOT NULL,
      network TEXT NOT NULL,
      user_agent TEXT NOT NULL,
      time_on_page REAL NOT NULL,
      engaged INTEGER NOT NULL,
      converted INTEGER NOT NULL,
      cost REAL NOT NULL,
      score INTEGER NOT NULL,
      reasons TEXT NOT NULL,
      action TEXT NOT NULL,
      enforcement TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS blocks (
      id TEXT PRIMARY KEY,
      target TEXT NOT NULL,
      kind TEXT NOT NULL,
      campaign TEXT NOT NULL,
      reason TEXT NOT NULL,
      score INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL,
      status TEXT NOT NULL,
      source TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS alerts (
      id TEXT PRIMARY KEY,
      ts INTEGER NOT NULL,
      level TEXT NOT NULL,
      message TEXT NOT NULL,
      read INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      amount INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      period_end INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS checkouts (
      id TEXT PRIMARY KEY,
      plan TEXT NOT NULL,
      amount INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS password_resets (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token_hash TEXT NOT NULL,
      expires_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS clicks_ts ON clicks (ts);
    CREATE INDEX IF NOT EXISTS clicks_ip ON clicks (ip);
    CREATE INDEX IF NOT EXISTS clicks_device ON clicks (device_hash);
    CREATE INDEX IF NOT EXISTS blocks_status ON blocks (status, campaign);
  `);

  const userColumns = await queryAll<{ name: string }>(db, "PRAGMA table_info(users)");
  if (!userColumns.some((column) => column.name === "ads_account")) {
    await execute(db, "ALTER TABLE users ADD COLUMN ads_account TEXT NOT NULL DEFAULT ''");
  }

  const defaults: Record<string, string> = {
    sensitivity: "balanced",
    blockDays: "30",
    autoBlock: "true",
    domain: "AnodeH.com",
    domainKey: "cf_live_nw_4k9m2p",
  };
  for (const [key, value] of Object.entries(defaults)) {
    await execute(db, "INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)", [key, value]);
  }
}

async function openDb(): Promise<Client> {
  const db = createTurso();
  await migrate(db);
  const { seedIfEmpty } = await import("./seed");
  const tx = await db.transaction("write");
  try {
    await seedIfEmpty(tx);
    await tx.commit();
  } catch (error) {
    await tx.rollback();
    throw error;
  } finally {
    tx.close();
  }
  return db;
}

export async function getDb(): Promise<Client> {
  if (!globalForDb.AnodeH) {
    globalForDb.AnodeH = openDb().catch((error) => {
      globalForDb.AnodeH = undefined;
      throw error;
    });
  }
  const db = await globalForDb.AnodeH;
  await expireBlocks(db);
  return db;
}

export async function expireBlocks(db: Db) {
  try {
    await execute(
      db,
      "UPDATE blocks SET status = 'expired' WHERE status = 'active' AND expires_at < ?",
      [Math.floor(Date.now() / 1000)],
    );
  } catch (error) {
    console.error("Could not expire old exclusions", error);
  }
}
