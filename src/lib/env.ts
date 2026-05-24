const PLACEHOLDER_MARKERS = [
  "****************",
  "YOUR_PASSWORD",
  "YOUR_REAL_PASSWORD",
  "change-me",
];

export function getEnvConfig() {
  return {
    databaseUrl: process.env.DATABASE_URL ?? "",
    adminUsername: process.env.ADMIN_USERNAME ?? "",
    adminEmail: process.env.ADMIN_EMAIL ?? "",
    adminPassword: process.env.ADMIN_PASSWORD ?? "",
    adminToken: process.env.ADMIN_TOKEN ?? "",
  };
}

export function validateServerEnv(): { ok: true } | { ok: false; errors: string[] } {
  const errors: string[] = [];
  const cfg = getEnvConfig();

  if (!cfg.databaseUrl.trim()) {
    errors.push("DATABASE_URL is missing in backend/.env");
  } else if (PLACEHOLDER_MARKERS.some((m) => cfg.databaseUrl.includes(m))) {
    errors.push(
      "DATABASE_URL still uses a placeholder password. Open backend/.env and paste your real Neon password."
    );
  }

  if (!cfg.adminUsername.trim()) errors.push("ADMIN_USERNAME is missing");
  if (!cfg.adminEmail.trim()) errors.push("ADMIN_EMAIL is missing");
  if (!cfg.adminPassword.trim()) errors.push("ADMIN_PASSWORD is missing");
  if (!cfg.adminToken.trim()) errors.push("ADMIN_TOKEN is missing");

  if (process.env.NODE_ENV === "production") {
    if (!process.env.STUDENT_TOKEN?.trim()) {
      errors.push("STUDENT_TOKEN is missing (required in production)");
    }
    const weak = ["change-me", "student-secret", "student-token"];
    if (weak.some((w) => cfg.adminToken.includes(w))) {
      errors.push("ADMIN_TOKEN looks like a placeholder — use a long random secret");
    }
  }

  return errors.length === 0 ? { ok: true } : { ok: false, errors };
}
