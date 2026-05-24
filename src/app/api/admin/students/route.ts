export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { initializeDatabase } from "@/lib/init-db";
import { query } from "@/lib/db";
import { verifyAuth, unauthorized } from "@/lib/auth";
import { calculateFromSubjects } from "@/lib/grades";
import { handleDbError, jsonError, jsonOk } from "@/lib/api-response";
import { MSG } from "@/lib/messages";

export async function GET(request: NextRequest) {
  if (!verifyAuth(request)) return unauthorized();
  try {
    await initializeDatabase();
    const rows = await query(
      "SELECT id, student_id, name, subjects, total, grade, created_at FROM students ORDER BY name ASC"
    );
    return jsonOk({ data: rows });
  } catch (error) {
    return handleDbError(error, "GET /api/admin/students");
  }
}

export async function POST(request: NextRequest) {
  if (!verifyAuth(request)) return unauthorized();
  try {
    await initializeDatabase();
    const body = await request.json();
    const { student_id, name, subjects, total, grade } = body;

    if (!student_id?.trim() || !name?.trim()) {
      return jsonError(MSG.register.failure, 400);
    }

    const subjectsObj = (subjects ?? {}) as Record<string, string>;
    const computed = calculateFromSubjects(subjectsObj);

    const rows = await query(
      `INSERT INTO students (student_id, name, subjects, total, grade)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, student_id, name, subjects, total, grade`,
      [
        student_id.trim(),
        name.trim(),
        JSON.stringify(subjectsObj),
        total ?? computed.total,
        grade ?? computed.grade,
      ]
    );
    return jsonOk({ data: rows[0] }, MSG.register.success, 201);
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: string }).code === "23505"
    ) {
      return jsonError(MSG.register.failure, 409);
    }
    return handleDbError(error, "POST /api/admin/students");
  }
}
