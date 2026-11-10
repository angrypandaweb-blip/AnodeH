import fs from "node:fs";
import path from "node:path";
import { createClient } from "@libsql/client";

const BATCH = 80;

function loadEnvFile(file) {
  if (!fs.existsSync(file)) return;
  const text = fs.readFileSync(file, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

function quoteIdent(name) {
  return `"${String(name).replaceAll('"', '""')}"`;
}

function ensureIfNotExists(sql) {
  return sql
    .replace(/^CREATE TABLE\b/i, "CREATE TABLE IF NOT EXISTS")
    .replace(/^CREATE UNIQUE INDEX\b/i, "CREATE UNIQUE INDEX IF NOT EXISTS")
    .replace(/^CREATE INDEX\b/i, "CREATE INDEX IF NOT EXISTS");
}

function cell(value) {
  if (typeof value === "bigint") return Number(value);
  return value;
}

async function main() {
  loadEnvFile(path.join(process.cwd(), ".env"));
  loadEnvFile(path.join(process.cwd(), ".env.local"));

  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url) throw new Error("TURSO_DATABASE_URL is not set");
  if (!authToken) throw new Error("TURSO_AUTH_TOKEN is not set");

  const sourcePath = path.resolve(process.argv[2] || path.join("data", "AnodeH.sqlite"));
  if (!fs.existsSync(sourcePath)) throw new Error(`SQLite file not found: ${sourcePath}`);

  const local = createClient({
    url: `file:${sourcePath.replaceAll("\\", "/")}`,
    intMode: "number",
  });
  const remote = createClient({ url, authToken, intMode: "number" });

  const tables = await local.execute(
    `SELECT name, sql FROM sqlite_master
     WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND sql IS NOT NULL
     ORDER BY name`,
  );
  const indexes = await local.execute(
    `SELECT sql FROM sqlite_master
     WHERE type = 'index' AND sql IS NOT NULL AND name NOT LIKE 'sqlite_%'`,
  );

  for (const table of tables.rows) {
    await remote.execute(ensureIfNotExists(String(table.sql)));
  }
  for (const index of indexes.rows) {
    await remote.execute(ensureIfNotExists(String(index.sql)));
  }

  const tx = await remote.transaction("write");
  try {
    for (const table of tables.rows) {
      const name = String(table.name);
      const info = await local.execute(`PRAGMA table_info(${quoteIdent(name)})`);
      const columns = info.rows.map((row) => String(row.name));
      const rows = await local.execute(`SELECT * FROM ${quoteIdent(name)}`);
      await tx.execute(`DELETE FROM ${quoteIdent(name)}`);
      const columnSql = columns.map(quoteIdent).join(", ");
      const placeholders = columns.map(() => "?").join(", ");
      const insert = `INSERT INTO ${quoteIdent(name)} (${columnSql}) VALUES (${placeholders})`;

      for (let i = 0; i < rows.rows.length; i += BATCH) {
        const slice = rows.rows.slice(i, i + BATCH);
        await tx.batch(
          slice.map((row) => ({
            sql: insert,
            args: columns.map((column) => cell(row[column])),
          })),
        );
      }
      console.log(`${name}: ${rows.rows.length} rows`);
    }
    await tx.commit();
  } catch (error) {
    await tx.rollback();
    throw error;
  } finally {
    tx.close();
  }

  local.close();
  remote.close();
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
