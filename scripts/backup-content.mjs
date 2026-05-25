import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";
import dotenv from "dotenv";

const { Client } = pg;
dotenv.config({ path: ".env.local" });
dotenv.config();

const tables = [
  "users",
  "workspaces",
  "spaces",
  "pages",
  "page_versions",
  "channels",
  "messages",
  "comments",
  "page_comments",
];

function safeRow(table, row) {
  if (table !== "users") return row;
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    status: row.status,
    app_role: row.app_role,
    is_global_admin: row.is_global_admin,
    has_password_hash: Boolean(row.password_hash),
    email_verified: row.email_verified,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const backup = {
    exportedAt: new Date().toISOString(),
    tables: {},
  };

  for (const table of tables) {
    const result = await client.query(`select * from ${table}`);
    backup.tables[table] = result.rows.map((row) => safeRow(table, row));
  }

  await client.end();

  const backupDir = join(process.cwd(), "backups");
  mkdirSync(backupDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const file = join(backupDir, `saralops-content-${stamp}.json`);
  writeFileSync(file, JSON.stringify(backup, null, 2));

  console.log(`Backup written: ${file}`);
  for (const [table, rows] of Object.entries(backup.tables)) {
    console.log(`${table}: ${rows.length}`);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
