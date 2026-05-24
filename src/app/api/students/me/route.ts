export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { initializeDatabase } from "@/lib/init-db";
import { query } from "@/lib/db";
import { verifyStudentAuth, unauthorized } from "@/lib/auth";
import { handleDbError, jsonError, jsonOk } from "@/lib/api-response";
import { MSG } from "@/lib/messages";
import { calculateGpaFromSubjects } from "@/lib/grades";

export async function GET(request: NextRequest) {
  if (!verifyStudentAuth(request)) return unauthorized();

  const studentId = request.nextUrl.searchParams.get("student_id")?.trim();
  if (!studentId) {
    return jsonError(MSG.search.notFound, 400);
  }

  try {
    await initializeDatabase();
    const rows = await query(
      `SELECT id, student_id, name, subjects, total, grade FROM students
       WHERE LOWER(TRIM(student_id)) = LOWER(TRIM($1)) LIMIT 1`,
      [studentId]
    );

    if (rows.length === 0) {
      return jsonError(MSG.search.notFound, 404);
    }

    const student = rows[0] as {
      student_id: string;
      name: string;
      subjects: Record<string, string>;
      total: number;
      grade: string;
    };
    const gpa = calculateGpaFromSubjects(student.subjects || {});

    return jsonOk(
      {
        data: { ...student, gpa: gpa.gpa, average: gpa.average },
      },
      MSG.search.found
    );
  } catch (error) {
    return handleDbError(error, "GET /api/students/me");
  }
}
