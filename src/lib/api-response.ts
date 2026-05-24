import { MSG } from "./messages";

export function jsonOk<T extends object>(data: T, message?: string, status = 200) {
  return Response.json({ ...data, ...(message ? { message } : {}) }, { status });
}

export function jsonError(message: string, status: number, extra?: object) {
  return Response.json({ error: message, message, ...extra }, { status });
}

export function handleDbError(error: unknown, context: string) {
  console.error(`[${context}]`, error);
  const raw = error instanceof Error ? error.message : "";

  if (raw.includes("DATABASE_URL") || raw.includes("placeholder")) {
    return jsonError(MSG.db.unableToProcess, 503, { code: "ENV_CONFIG" });
  }

  if (
    raw.includes("password authentication failed") ||
    raw.includes("ENOTFOUND") ||
    raw.includes("ECONNREFUSED")
  ) {
    return jsonError(MSG.db.connectionFailed, 503, { code: "DB_CONNECTION" });
  }

  return jsonError(MSG.backend.operationFailed, 500);
}
