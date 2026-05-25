/**
 * Seed demo users for local development.
 * Usage: node scripts/seed-demo-users.mjs
 *
 * Reads .env.local for DATABASE_URL (falls back to process.env).
 */
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env.local if present
const envPath = join(__dirname, "..", ".env.local");
try {
  const envContent = readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, "");
    if (!process.env[key]) process.env[key] = val;
  }
} catch (e) {
  // ignore
}

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL not found in environment (.env.local)");
  process.exit(1);
}

let Client;
try {
  const pgModule = await import("pg");
  Client = pgModule.default?.Client ?? pgModule.Client;
} catch (err) {
  console.error("❌ pg not installed. Run: npm install");
  process.exit(1);
}

const client = new Client({ connectionString: DATABASE_URL });
try {
  await client.connect();
  console.log("✅ Connected to database");
} catch (err) {
  console.error("❌ Connection failed:", err.message);
  process.exit(1);
}

const users = [
  { username: "admin", email: "admin@test.com", password: "Admin@123", isGlobalAdmin: true, name: "Admin" },
  { username: "user1", email: "user1@test.com", password: "User@123", isGlobalAdmin: false, name: "User One" },
  { username: "user2", email: "user2@test.com", password: "User@123", isGlobalAdmin: false, name: "User Two" },
  { username: "teacher", email: "teacher@test.com", password: "Teacher@123", isGlobalAdmin: false, name: "Teacher" },
  { username: "student", email: "student@test.com", password: "Student@123", isGlobalAdmin: false, name: "Student" },
];

try {
  const { default: bcrypt } = await import("bcryptjs");

  for (const u of users) {
    const hash = await bcrypt.hash(u.password, 12);

    const { rows: existing } = await client.query(
      "SELECT id FROM users WHERE email = $1 LIMIT 1",
      [u.email]
    );

    let userId;
    if (existing.length > 0) {
      userId = existing[0].id;
      await client.query(
        "UPDATE users SET password_hash = $1, status = 'active', name = $2, updated_at = NOW() WHERE id = $3",
        [hash, u.name, userId]
      );
      console.log(`  ✓ Updated user: ${u.email}`);
    } else {
      const insertSql = `INSERT INTO users (id, email, name, password_hash, status, is_global_admin, email_verified, created_at, updated_at)
        VALUES (gen_random_uuid(), $1, $2, $3, 'active', $4, NOW(), NOW(), NOW()) RETURNING id`;
      const { rows: ins } = await client.query(insertSql, [u.email, u.name, hash, u.isGlobalAdmin]);
      userId = ins[0].id;
      console.log(`  ✓ Created user: ${u.email}`);
    }

    // Ensure workspace for user's email domain
    const domain = u.email.split("@")[1] ?? "local";
    const slug = domain.replace(/\./g, "-");
    const workspaceName = domain.includes("sarallabs") ? "Saral Labs" : domain.includes("saralvidhya") ? "Saral Vidhya" : domain;

    const { rows: wsExisting } = await client.query(
      "SELECT id FROM workspaces WHERE slug = $1 LIMIT 1",
      [slug]
    );

    let workspaceId;
    if (wsExisting.length === 0) {
      const { rows: wsIns } = await client.query(
        `INSERT INTO workspaces (id, name, slug, created_at, updated_at) VALUES (gen_random_uuid(), $1, $2, NOW(), NOW()) RETURNING id`,
        [workspaceName, slug]
      );
      workspaceId = wsIns[0].id;
      console.log(`    ✓ Created workspace: ${slug}`);
    } else {
      workspaceId = wsExisting[0].id;
    }

    // Ensure membership
    const { rows: membership } = await client.query(
      "SELECT id FROM memberships WHERE user_id = $1 AND workspace_id = $2 LIMIT 1",
      [userId, workspaceId]
    );
    if (membership.length === 0) {
      // Make the admin user owner of their workspace; others member
      const role = u.username === "admin" ? 'owner' : 'member';
      await client.query(
        `INSERT INTO memberships (id, user_id, workspace_id, role, joined_at) VALUES (gen_random_uuid(), $1, $2, $3, NOW())`,
        [userId, workspaceId, role]
      );
      console.log(`    ✓ Added membership (${role}) to workspace ${slug}`);
    }
  }
} catch (err) {
  console.error("⚠️  Seed error:", err.message);
} finally {
  await client.end();
  console.log("\n🎉 Demo users seeded.");
  console.log("  Login at http://localhost:3000 with the seeded emails and passwords.");
}
