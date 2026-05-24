export const dynamic = "force-dynamic";

import { initializeDatabase } from "@/lib/init-db";
import { testConnection, query } from "@/lib/db";
import { validateServerEnv, getEnvConfig } from "@/lib/env";
import { assertStrongTokensInProduction } from "@/lib/tokens";

export async function GET() {
  const envCheck = validateServerEnv();
  if (!envCheck.ok) {
    return Response.json(
      {
        status: "error",
        database: "not_configured",
        errors: envCheck.errors,
        hint: "Edit backend/.env — set real Neon DATABASE_URL password.",
      },
      { status: 503 }
    );
  }

  try {
    assertStrongTokensInProduction();
    await testConnection();
    await initializeDatabase();

    const [studentRow] = await query<{ count: string }>(
      "SELECT COUNT(*)::text AS count FROM students"
    );
    const [userRow] = await query<{ count: string }>(
      "SELECT COUNT(*)::text AS count FROM users"
    );
    const cfg = getEnvConfig();

    return Response.json({
      status: "ok",
      database: "connected",
      tables: { users: parseInt(userRow?.count ?? "0", 10), students: parseInt(studentRow?.count ?? "0", 10) },
      adminUsername: cfg.adminUsername,
      adminEmail: cfg.adminEmail,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Database connection failed";
    const hint = message.includes("password authentication failed")
      ? "Wrong Neon password in backend/.env — copy a fresh connection string from console.neon.tech"
      : "Check DATABASE_URL in backend/.env";
    return Response.json(
      { status: "error", database: "disconnected", error: message, hint },
      { status: 503 }
    );
  }
}
