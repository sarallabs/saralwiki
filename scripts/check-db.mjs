import { readFileSync } from "fs";
import { join } from "path";
import { Client } from "pg";

const envFile = join(process.cwd(), ".env.local");
const env = {};
for (const line of readFileSync(envFile, "utf8").split(/\r?\n/)) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const idx = trimmed.indexOf("=");
  if (idx === -1) continue;
  env[trimmed.slice(0, idx)] = trimmed.slice(idx + 1);
}

const urls = [
  { name: "DATABASE_URL", value: env.DATABASE_URL },
  { name: "DIRECT_URL", value: env.DIRECT_URL },
].filter((item) => item.value);

if (urls.length === 0) {
  console.error("ERROR: DATABASE_URL or DIRECT_URL not found in .env.local");
  process.exit(1);
}

for (const { name, value } of urls) {
  console.log(`\n--- Testing ${name} ---`);
  const client = new Client({ connectionString: value });
  try {
    await client.connect();
    console.log(`${name} CONNECT OK`);
    const res = await client.query(
      "SELECT id, email, status, password_hash IS NOT NULL AS has_password FROM users ORDER BY email LIMIT 10"
    );
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error(`${name} ERROR`, err.message);
    if (err.code) console.error("CODE", err.code);
    if (err.detail) console.error("DETAIL", err.detail);
    if (err.hint) console.error("HINT", err.hint);
  } finally {
    await client.end();
  }
}
