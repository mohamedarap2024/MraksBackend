export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { initializeDatabase } from "@/lib/init-db";
import { query } from "@/lib/db";
import { handleDbError, jsonError, jsonOk } from "@/lib/api-response";
import { MSG } from "@/lib/messages";

export async function POST(request: NextRequest) {
  try {
    await initializeDatabase();

    const body = await request.json();
    const { username, password } = body as {
      username?: string;
      password?: string;
    };

    if (!username?.trim() || !password) {
      return jsonError(MSG.login.failure, 400);
    }

    const login = username.trim();

    const rows = await query<{
      id: number;
      username: string;
      email: string;
      password_hash: string;
    }>(
      `SELECT id, username, email, password_hash FROM users
       WHERE username = $1 OR LOWER(email) = LOWER($1)
       LIMIT 1`,
      [login]
    );

    if (rows.length === 0) {
      return jsonError(MSG.login.failure, 401);
    }

    const admin = rows[0];
    const isValid = await bcrypt.compare(password, admin.password_hash);

    if (!isValid) {
      return jsonError(MSG.login.failure, 401);
    }

    const token = process.env.ADMIN_TOKEN;
    if (!token) {
      return jsonError(MSG.backend.operationFailed, 500);
    }

    return jsonOk(
      {
        token,
        admin: {
          id: admin.id,
          username: admin.username,
          email: admin.email,
        },
      },
      MSG.login.success
    );
  } catch (error) {
    return handleDbError(error, "POST /api/admin/login");
  }
}
