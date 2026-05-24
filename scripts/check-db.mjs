import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
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
    if (!process.env[key]) process.env[key] = val;
  }
}

async function main() {
  loadEnv();
  const url = process.env.DATABASE_URL ?? "";
  if (!url || url.includes("****************")) {
    console.error("❌ Set real Neon password in backend/.env → DATABASE_URL");
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await pool.query("SELECT 1");
    console.log("✅ Database connected!");
    console.log("   Run: npm run dev  (backend port 5228)");
    console.log("   Then: cd ../frontend && npm run dev");
  } catch (err) {
    console.error("❌ Failed:", err instanceof Error ? err.message : err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
