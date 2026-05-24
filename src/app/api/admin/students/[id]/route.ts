export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { initializeDatabase } from "@/lib/init-db";
import { query } from "@/lib/db";
import { verifyAuth, unauthorized } from "@/lib/auth";
import { calculateFromSubjects } from "@/lib/grades";
import { handleDbError, jsonError, jsonOk } from "@/lib/api-response";
import { MSG } from "@/lib/messages";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!verifyAuth(request)) return unauthorized();
  const { id } = await params;
  const numericId = parseInt(id, 10);
  if (isNaN(numericId)) {
    return jsonError(MSG.update.failure, 400);
  }

  try {
    await initializeDatabase();
    const body = await request.json();
    const { student_id, name, subjects, total, grade } = body;

    if (!student_id?.trim() || !name?.trim()) {
      return jsonError(MSG.update.failure, 400);
    }

    const subjectsObj = (subjects ?? {}) as Record<string, string>;
    const computed = calculateFromSubjects(subjectsObj);

    const rows = await query(
      `UPDATE students SET student_id=$1, name=$2, subjects=$3, total=$4, grade=$5, updated_at=NOW()
       WHERE id=$6 RETURNING id, student_id, name, subjects, total, grade`,
      [
        student_id.trim(),
        name.trim(),
        JSON.stringify(subjectsObj),
        total ?? computed.total,
        grade ?? computed.grade,
        numericId,
      ]
    );

    if (rows.length === 0) {
      return jsonError(MSG.update.failure, 404);
    }
    return jsonOk({ data: rows[0] }, MSG.update.success);
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: string }).code === "23505"
    ) {
      return jsonError(MSG.update.failure, 409);
    }
    return handleDbError(error, "PUT /api/admin/students/[id]");
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!verifyAuth(request)) return unauthorized();
  const { id } = await params;
  const numericId = parseInt(id, 10);
  if (isNaN(numericId)) {
    return jsonError(MSG.delete.failure, 400);
  }

  try {
    await initializeDatabase();
    const rows = await query(
      "DELETE FROM students WHERE id = $1 RETURNING id",
      [numericId]
    );
    if (rows.length === 0) {
      return jsonError(MSG.delete.failure, 404);
    }
    return jsonOk({}, MSG.delete.success);
  } catch (error) {
    return handleDbError(error, "DELETE /api/admin/students/[id]");
  }
}
