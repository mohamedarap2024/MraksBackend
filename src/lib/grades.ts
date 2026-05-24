export type GradeLetter = "A" | "B" | "C" | "D" | "F";

export function calculateGradeFromAverage(average: number): GradeLetter {
  if (average >= 90) return "A";
  if (average >= 80) return "B";
  if (average >= 70) return "C";
  if (average >= 60) return "D";
  return "F";
}

export function calculateFromSubjects(subjects: Record<string, string>): {
  total: number;
  grade: GradeLetter;
} {
  const scores = Object.values(subjects)
    .map((v) => parseInt(String(v), 10))
    .filter((v) => !isNaN(v));

  const total = scores.reduce((sum, v) => sum + v, 0);
  const average = scores.length > 0 ? total / scores.length : 0;
  return { total, grade: calculateGradeFromAverage(average) };
}

/** GPA on 4.0 scale from letter grade */
export function gradeToGpaPoints(grade: string): number {
  const map: Record<string, number> = { A: 4, B: 3, C: 2, D: 1, F: 0 };
  return map[grade.toUpperCase()] ?? 0;
}

export function calculateGpaFromSubjects(subjects: Record<string, string>): {
  gpa: number;
  average: number;
} {
  const scores = Object.values(subjects)
    .map((v) => parseInt(String(v), 10))
    .filter((v) => !isNaN(v));
  if (scores.length === 0) return { gpa: 0, average: 0 };
  const average = scores.reduce((a, b) => a + b, 0) / scores.length;
  const grade = calculateGradeFromAverage(average);
  return { gpa: gradeToGpaPoints(grade), average: Math.round(average * 10) / 10 };
}
