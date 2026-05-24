const WEAK_TOKENS = new Set([
  "change-me-secure-token",
  "student-secret-token",
  "student-token",
  "dev-only-student-token",
]);

export function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

export function getStudentToken(): string {
  const token =
    process.env.STUDENT_TOKEN?.trim() || process.env.ADMIN_TOKEN?.trim();
  if (token) return token;
  if (isProduction()) {
    throw new Error(
      "STUDENT_TOKEN is not set. Add it in Vercel → Environment Variables."
    );
  }
  return "dev-only-student-token";
}

export function assertStrongTokensInProduction(): void {
  if (!isProduction()) return;

  const admin = process.env.ADMIN_TOKEN?.trim();
  const student = process.env.STUDENT_TOKEN?.trim();

  if (!admin || WEAK_TOKENS.has(admin) || admin.length < 24) {
    throw new Error(
      "ADMIN_TOKEN must be a long random secret (32+ chars) in production."
    );
  }
  if (!student || WEAK_TOKENS.has(student) || student.length < 24) {
    throw new Error(
      "STUDENT_TOKEN must be a long random secret (32+ chars) in production."
    );
  }
}
