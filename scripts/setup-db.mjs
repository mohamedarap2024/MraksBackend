/**
 * Creates tables (users, students) and syncs admin from .env
 * Run: npm run db:setup
 */
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import bcrypt from "bcryptjs";
import { Pool } from "pg";

function loadEnv() {
  const envPath = resolve(process.cwd(), ".env");
  if (!existsSync(envPath)) {
    console.error("❌ backend/.env not found");
    process.exit(1);
  }
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    process.env[key] = val;
  }
}

async function main() {
  loadEnv();
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("❌ DATABASE_URL missing");
    process.exit(1);
  }

  const pool = new Pool({ connectionString: url, ssl: { rejectUnauthorized: false } });
  const client = await pool.connect();

  try {
    await client.query("SELECT 1");
    console.log("✅ Connected to Neon");

    await client.query(`
      CREATE TABLE IF NOT EXISTS students (
        id SERIAL PRIMARY KEY,
        student_id VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        subjects JSONB NOT NULL DEFAULT '{}',
        total INTEGER NOT NULL DEFAULT 0,
        grade VARCHAR(5) NOT NULL DEFAULT 'F',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    const username = process.env.ADMIN_USERNAME;
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;
    const hash = await bcrypt.hash(password, 12);

    const existing = await client.query(
      "SELECT id FROM users WHERE username = $1 OR LOWER(email) = LOWER($2)",
      [username, email]
    );

    if (existing.rows.length === 0) {
      await client.query(
        "INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3)",
        [username, email, hash]
      );
      console.log(`✅ Admin user created: ${username}`);
    } else {
      await client.query(
        "UPDATE users SET password_hash=$1, email=$2, username=$3, updated_at=NOW() WHERE id=$4",
        [hash, email, username, existing.rows[0].id]
      );
      console.log(`✅ Admin user updated: ${username}`);
    }

    const { rows } = await client.query(
      "SELECT (SELECT COUNT(*)::int FROM users) AS users, (SELECT COUNT(*)::int FROM students) AS students"
    );
    console.log(`📊 users: ${rows[0].users}, students: ${rows[0].students}`);
    console.log("\nLogin with username OR email:");
    console.log(`   ${username}  /  ${email}`);
    console.log(`   Password: ${password}`);
  } catch (err) {
    console.error("❌", err instanceof Error ? err.message : err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
