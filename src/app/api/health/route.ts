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
    let hint = "Check DATABASE_URL and all env vars in Vercel → Settings → Environment Variables.";
    if (message.includes("password authentication failed")) {
      hint =
        "Wrong Neon password — copy a fresh pooled connection string from console.neon.tech (no channel_binding).";
    } else if (message.includes("ADMIN_TOKEN") || message.includes("STUDENT_TOKEN")) {
      hint =
        "On your PC run: npm run secrets:generate — paste long tokens into Vercel (not admin-secret-token).";
    }
    return Response.json(
      { status: "error", database: "disconnected", error: message, hint },
      { status: 503 }
    );
  }
}
