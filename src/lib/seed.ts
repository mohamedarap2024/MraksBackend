import { calculateFromSubjects } from "./grades";
import { getPool } from "./db";

const SAMPLE_STUDENTS = [
  {
    student_id: "SIU-1001",
    name: "Ahmed Hassan",
    subjects: { Math: "85", English: "90", Science: "88", History: "92" },
  },
  {
    student_id: "SIU-1002",
    name: "Amina Mohamed",
    subjects: { Math: "92", English: "88", Science: "95", History: "90" },
  },
  {
    student_id: "SIU-1003",
    name: "Hassan Ali",
    subjects: { Math: "78", English: "82", Science: "80", History: "75" },
  },
  {
    student_id: "SIU-1004",
    name: "Fatima Omar",
    subjects: { Math: "95", English: "93", Science: "96", History: "94" },
  },
  {
    student_id: "SIU-1005",
    name: "Ibrahim Yusuf",
    subjects: { Math: "88", English: "86", Science: "84", History: "87" },
  },
];

export async function seedSampleStudentsIfEmpty(): Promise<number> {
  const client = await getPool().connect();
  try {
    const countResult = await client.query<{ count: string }>(
      "SELECT COUNT(*)::text AS count FROM students"
    );
    if (parseInt(countResult.rows[0]?.count ?? "0", 10) > 0) return 0;

    let inserted = 0;
    for (const row of SAMPLE_STUDENTS) {
      const { total, grade } = calculateFromSubjects(row.subjects);
      await client.query(
        `INSERT INTO students (student_id, name, subjects, total, grade)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (student_id) DO NOTHING`,
        [row.student_id, row.name, JSON.stringify(row.subjects), total, grade]
      );
      inserted++;
    }
    console.log(`[seed] Inserted ${inserted} sample students`);
    return inserted;
  } finally {
    client.release();
  }
}
