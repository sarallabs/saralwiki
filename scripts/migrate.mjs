/**
 * Run this script to apply ALL schema changes and seed the test user.
 * Usage: node scripts/migrate.mjs
 */

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env.local manually
const envPath = join(__dirname, "..", ".env.local");

try {
  const envContent = readFileSync(envPath, "utf-8");

  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) continue;

    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;

    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");

    if (!process.env[key]) process.env[key] = val;
  }
} catch {
  console.warn("⚠️ .env.local not found");
}

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL not found");
  process.exit(1);
}

let Client;

try {
  const pgModule = await import("pg");
  Client = pgModule.default?.Client ?? pgModule.Client;
} catch {
  console.error("❌ Run: npm install pg");
  process.exit(1);
}

// FIXED SUPABASE SSL CONNECTION
const client = new Client({
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

try {
  await client.connect();
  console.log("✅ Connected to Supabase");
} catch (err) {
  console.error("❌ Connection failed:", err.message);
  process.exit(1);
}

// Read migration SQL
const migrationPath = join(__dirname, "..", "drizzle", "0000_slimy_unus.sql");
const migration = readFileSync(migrationPath, "utf-8");

const statements = migration
  .split("--> statement-breakpoint")
  .map((s) => s.trim())
  .filter(Boolean);

console.log(`🚀 Applying ${statements.length} SQL statements...`);

let success = 0;
let skipped = 0;

for (let i = 0; i < statements.length; i++) {
  try {
    await client.query(statements[i]);
    success++;
  } catch (err) {
    const msg = (err.message || "").toLowerCase();

    if (
      msg.includes("already exists") ||
      msg.includes("duplicate") ||
      msg.includes("already been created")
    ) {
      skipped++;
    } else {
      console.log(`Skipped statement ${i + 1}: ${err.message}`);
    }
  }
}

console.log(`✅ Migration complete: ${success} applied, ${skipped} skipped`);

// Seed admin user
try {
  const { default: bcrypt } = await import("bcryptjs");

  const hash = await bcrypt.hash("rahman@1234", 12);

  const existing = await client.query(
    "SELECT id FROM users WHERE email = $1 LIMIT 1",
    ["rahman@saralvidhya.com"]
  );

  let userId;

  if (existing.rows.length > 0) {
    userId = existing.rows[0].id;

    await client.query(
      "UPDATE users SET password_hash=$1, status='active' WHERE id=$2",
      [hash, userId]
    );

    console.log("✅ User updated");
  } else {
    const inserted = await client.query(`
      INSERT INTO users (
        id,
        email,
        name,
        password_hash,
        status,
        is_global_admin,
        email_verified,
        created_at,
        updated_at
      )
      VALUES (
        gen_random_uuid(),
        'rahman@saralvidhya.com',
        'Rahman',
        '${hash}',
        'active',
        true,
        NOW(),
        NOW(),
        NOW()
      )
      RETURNING id
    `);

    userId = inserted.rows[0].id;

    console.log("✅ User created");
  }

  const workspaceCheck = await client.query(
    "SELECT id FROM workspaces WHERE slug = 'saralvidhya-com' LIMIT 1"
  );

  let workspaceId;

  if (workspaceCheck.rows.length > 0) {
    workspaceId = workspaceCheck.rows[0].id;
  } else {
    const ws = await client.query(`
      INSERT INTO workspaces (
        id,
        name,
        slug,
        created_at,
        updated_at
      )
      VALUES (
        gen_random_uuid(),
        'Saral Vidhya',
        'saralvidhya-com',
        NOW(),
        NOW()
      )
      RETURNING id
    `);

    workspaceId = ws.rows[0].id;
  }

  await client.query(`
    INSERT INTO memberships (
      id,
      user_id,
      workspace_id,
      role,
      joined_at
    )
    VALUES (
      gen_random_uuid(),
      '${userId}',
      '${workspaceId}',
      'owner',
      NOW()
    )
    ON CONFLICT DO NOTHING
  `);

  console.log("✅ Membership created");

} catch (err) {
  console.log("Seed error:", err.message);
}

await client.end();

console.log("🎉 DONE");
console.log("Login:");
console.log("Email: rahman@saralvidhya.com");
console.log("Password: rahman@1234");