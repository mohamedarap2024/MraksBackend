import { NextRequest } from "next/server";
import { getStudentToken } from "./tokens";

export function verifyAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return false;

  const token = authHeader.slice(7);
  const validToken = process.env.ADMIN_TOKEN;
  if (!validToken) {
    console.error("ADMIN_TOKEN is not set");
    return false;
  }
  return token === validToken;
}

export function verifyStudentAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return false;
  const token = authHeader.slice(7);
  try {
    return token === getStudentToken();
  } catch {
    return false;
  }
}

export function unauthorized() {
  return Response.json(
    { error: "Login failed. Unable to verify user", message: "Login failed. Unable to verify user" },
    { status: 401 }
  );
}
