import { randomBytes } from "crypto";
import { createClient, type Client, type InArgs, type Transaction } from "@libsql/client";

export type { Client };
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

  await addColumn(db, "users", "ads_account", "TEXT NOT NULL DEFAULT ''");
  await addColumn(db, "users", "domain_key", "TEXT NOT NULL DEFAULT ''");
  await addColumn(db, "clicks", "user_id", "TEXT NOT NULL DEFAULT ''");
  await addColumn(db, "blocks", "user_id", "TEXT NOT NULL DEFAULT ''");
  await addColumn(db, "alerts", "user_id", "TEXT NOT NULL DEFAULT ''");
  await addColumn(db, "allowlist", "user_id", "TEXT NOT NULL DEFAULT ''");
  const allowSql = await queryOne<{ sql: string }>(db, "SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'allowlist'");
  if (allowSql?.sql.includes("UNIQUE")) {
    await db.executeMultiple(`
      CREATE TABLE allowlist_v2 (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL DEFAULT '',
        value TEXT NOT NULL,
        note TEXT NOT NULL
      );
      INSERT INTO allowlist_v2 (id, user_id, value, note)
        SELECT id, user_id, value, note FROM allowlist;
      DROP TABLE allowlist;
      ALTER TABLE allowlist_v2 RENAME TO allowlist;
      CREATE UNIQUE INDEX allowlist_user_value ON allowlist (user_id, value);
    `);
  }
  await addColumn(db, "payments", "user_id", "TEXT NOT NULL DEFAULT ''");
  await addColumn(db, "checkouts", "user_id", "TEXT NOT NULL DEFAULT ''");
  await execute(
    db,
    `CREATE TABLE IF NOT EXISTS user_settings (
      user_id TEXT NOT NULL,
      key TEXT NOT NULL,
      value TEXT NOT NULL,
      PRIMARY KEY (user_id, key)
    )`,
  );
  await execute(db, "CREATE INDEX IF NOT EXISTS clicks_user_ts ON clicks (user_id, ts)");
  await execute(db, "CREATE INDEX IF NOT EXISTS blocks_user_status ON blocks (user_id, status, campaign)");
  await execute(db, "CREATE UNIQUE INDEX IF NOT EXISTS users_domain_key ON users (domain_key) WHERE domain_key != ''");
  await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS google_ads (
      user_id TEXT PRIMARY KEY,
      refresh_token TEXT NOT NULL,
      customer_id TEXT NOT NULL DEFAULT '',
      login_customer_id TEXT NOT NULL DEFAULT '',
      connected_at INTEGER NOT NULL,
      synced_at INTEGER NOT NULL DEFAULT 0,
      last_error TEXT NOT NULL DEFAULT ''
    );
    CREATE TABLE IF NOT EXISTS google_campaigns (
      user_id TEXT NOT NULL,
      campaign_id TEXT NOT NULL,
      name TEXT NOT NULL,
      channel TEXT NOT NULL,
      status TEXT NOT NULL,
      PRIMARY KEY (user_id, campaign_id)
    );
    CREATE TABLE IF NOT EXISTS google_daily (
      user_id TEXT NOT NULL,
      day TEXT NOT NULL,
      campaign TEXT NOT NULL,
      clicks INTEGER NOT NULL,
      cost_micros INTEGER NOT NULL,
      PRIMARY KEY (user_id, day, campaign)
    );
    CREATE TABLE IF NOT EXISTS google_clicks (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      gclid TEXT NOT NULL,
      ts INTEGER NOT NULL,
      campaign TEXT NOT NULL,
      keyword TEXT NOT NULL,
      device TEXT NOT NULL,
      ad_group TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS google_clicks_user_ts ON google_clicks (user_id, ts);
    CREATE TABLE IF NOT EXISTS email_log (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      kind TEXT NOT NULL,
      ref TEXT NOT NULL,
      sent_at INTEGER NOT NULL
    );
    CREATE UNIQUE INDEX IF NOT EXISTS email_log_kind_ref ON email_log (kind, ref);
  `);

  const unsigned = await queryAll<{ id: string }>(db, "SELECT id FROM users WHERE domain_key = ''");
  for (const row of unsigned) {
    await execute(db, "UPDATE users SET domain_key = ? WHERE id = ?", [`cf_${randomBytes(8).toString("hex")}`, row.id]);
  }

  const scoped = await queryOne<{ value: string }>(db, "SELECT value FROM settings WHERE key = 'accounts_scoped'");
  if (!scoped) {
    const shared = await queryAll<{ key: string; value: string }>(
      db,
      "SELECT key, value FROM settings WHERE key IN ('paid_until', 'intro_used', 'paypal_subscription', 'paypal_synced_at')",
    );
    const people = await queryAll<{ id: string }>(db, "SELECT id FROM users");
    for (const person of people) {
      for (const row of shared) {
        await execute(
          db,
          "INSERT INTO user_settings (user_id, key, value) VALUES (?, ?, ?) ON CONFLICT(user_id, key) DO NOTHING",
          [person.id, row.key, row.value],
        );
      }
    }
    await execute(db, "INSERT INTO settings (key, value) VALUES ('accounts_scoped', '1')");
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

async function addColumn(db: Client, table: string, column: string, definition: string) {
  const columns = await queryAll<{ name: string }>(db, `PRAGMA table_info(${table})`);
  if (!columns.some((item) => item.name === column)) {
    await execute(db, `ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
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
