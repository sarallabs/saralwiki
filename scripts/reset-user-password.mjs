import { readFileSync } from "node:fs";
import pg from "pg";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

const { Client } = pg;
dotenv.config({ path: ".env.local" });
dotenv.config();

function arg(name) {
  const prefix = `--${name}=`;
  const found = process.argv.find((item) => item.startsWith(prefix));
  return found ? found.slice(prefix.length) : undefined;
}

async function main() {
  const email = arg("email")?.trim().toLowerCase();
  const password = arg("password");
  const passwordFile = arg("password-file");
  const finalPassword = password ?? (passwordFile ? readFileSync(passwordFile, "utf8").trim() : undefined);

  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
  if (!email) throw new Error("Usage: node scripts/reset-user-password.mjs --email=user@example.com --password=NewPassword123");
  if (!finalPassword || finalPassword.length < 8) throw new Error("Password must be at least 8 characters");

  const hash = await bcrypt.hash(finalPassword, 12);
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const result = await client.query(
    `update users
     set password_hash = $1, status = 'active', updated_at = now()
     where lower(email) = lower($2)
     returning id, email, name, status, is_global_admin`,
    [hash, email]
  );

  await client.end();

  if (result.rowCount === 0) throw new Error(`No user found for ${email}`);
  console.log(`Password reset for ${result.rows[0].email}`);
  console.log(`Status: ${result.rows[0].status}`);
  console.log(`Global admin: ${result.rows[0].is_global_admin}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
