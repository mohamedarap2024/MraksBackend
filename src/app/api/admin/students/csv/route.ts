export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { initializeDatabase } from "@/lib/init-db";
import { verifyAuth, unauthorized } from "@/lib/auth";
import { calculateFromSubjects } from "@/lib/grades";
import { parseStudentCsv } from "@/lib/csv-import";
import { withTransaction } from "@/lib/db";
import { handleDbError, jsonError, jsonOk } from "@/lib/api-response";
import { MSG } from "@/lib/messages";

export async function POST(request: NextRequest) {
  if (!verifyAuth(request)) return unauthorized();

  try {
    await initializeDatabase();
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return jsonError(MSG.upload.failure, 400);
    }
    if (!file.name.endsWith(".csv")) {
      return jsonError(MSG.upload.failure, 400);
    }

    const { rows, errors, skipped: parseSkipped } = parseStudentCsv(
      await file.text()
    );

    if (errors.length > 0 || rows.length === 0) {
      return jsonError(MSG.upload.failure, 400);
    }

    let insertedCount = 0;
    const skippedCount = parseSkipped;

    await withTransaction(async (client) => {
      for (const row of rows) {
        const { total, grade } = calculateFromSubjects(row.subjects);

        await client.query(
          `INSERT INTO students (student_id, name, subjects, total, grade)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (student_id) DO UPDATE
             SET name=EXCLUDED.name, subjects=EXCLUDED.subjects,
                 total=EXCLUDED.total, grade=EXCLUDED.grade`,
          [
            row.studentId,
            row.name,
            JSON.stringify(row.subjects),
            total,
            grade,
          ]
        );
        insertedCount++;
      }
    });

    return jsonOk(
      { count: insertedCount, skipped: skippedCount },
      MSG.upload.success
    );
  } catch (error) {
    return handleDbError(error, "POST /api/admin/students/csv");
  }
}
