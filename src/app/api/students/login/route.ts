export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { initializeDatabase } from "@/lib/init-db";
import { query } from "@/lib/db";
import { handleDbError, jsonError, jsonOk } from "@/lib/api-response";
import { MSG } from "@/lib/messages";
import { calculateGpaFromSubjects } from "@/lib/grades";
import { getStudentToken } from "@/lib/tokens";

export async function POST(request: NextRequest) {
  try {
    await initializeDatabase();
    const body = await request.json();
    const studentId = (body.student_id as string)?.trim();
    const password = body.password as string | undefined;

    if (!studentId) {
      return jsonError(MSG.login.failure, 400);
    }

    const rows = await query<{
      id: number;
      student_id: string;
      name: string;
      subjects: Record<string, string>;
      total: number;
      grade: string;
      pin_hash: string | null;
    }>(
      `SELECT id, student_id, name, subjects, total, grade, pin_hash FROM students
       WHERE LOWER(TRIM(student_id)) = LOWER(TRIM($1)) LIMIT 1`,
      [studentId]
    );

    if (rows.length === 0) {
      return jsonError(MSG.login.failure, 401);
    }

    const student = rows[0];

    if (student.pin_hash) {
      if (!password || !(await bcrypt.compare(password, student.pin_hash))) {
        return jsonError(MSG.login.failure, 401);
      }
    }

    const token = getStudentToken();
    const gpa = calculateGpaFromSubjects(student.subjects || {});

    return jsonOk(
      {
        token,
        student: {
          id: student.id,
          student_id: student.student_id,
          name: student.name,
          subjects: student.subjects,
          total: student.total,
          grade: student.grade,
          gpa: gpa.gpa,
          average: gpa.average,
        },
      },
      MSG.login.success
    );
  } catch (error) {
    return handleDbError(error, "POST /api/students/login");
  }
}
