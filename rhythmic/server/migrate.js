import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pool } from "./db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function ensureMigrationsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT NOW()
    )
  `);
}

async function listMigrationFiles() {
  const dir = path.join(__dirname, "migrations");
  const files = await fs.readdir(dir);
  return files
    .filter((f) => f.endsWith(".sql"))
    .sort((a, b) => a.localeCompare(b));
}

async function alreadyApplied(client, id) {
  const res = await client.query(`SELECT 1 FROM migrations WHERE id = $1`, [id]);
  return res.rowCount > 0;
}

async function applyMigration(client, id, sql) {
  await client.query("BEGIN");
  try {
    await client.query(sql);
    await client.query(`INSERT INTO migrations (id) VALUES ($1)`, [id]);
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  }
}

async function main() {
  const client = await pool.connect();
  try {
    await ensureMigrationsTable(client);
    const files = await listMigrationFiles();
    for (const file of files) {
      const id = file;
      // eslint-disable-next-line no-console
      console.log(`migration: ${id}`);
      if (await alreadyApplied(client, id)) {
        // eslint-disable-next-line no-console
        console.log(`- already applied`);
        continue;
      }
      const sql = await fs.readFile(path.join(__dirname, "migrations", file), "utf8");
      await applyMigration(client, id, sql);
      // eslint-disable-next-line no-console
      console.log(`- applied`);
    }
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});

