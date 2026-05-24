import { NextRequest, NextResponse } from "next/server";

const ALLOWED_ORIGINS = (
  process.env.CORS_ORIGIN ?? "http://localhost:3000,http://localhost:3001"
)
  .split(",")
  .map((o) => o.trim().replace(/\/$/, ""))
  .filter(Boolean);

const ALLOW_VERCEL_PREVIEWS = process.env.CORS_ALLOW_VERCEL === "true";

function isAllowedOrigin(origin: string): boolean {
  const normalized = origin.replace(/\/$/, "");
  if (ALLOWED_ORIGINS.includes(normalized)) return true;
  if (
    ALLOW_VERCEL_PREVIEWS &&
    /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(normalized)
  ) {
    return true;
  }
  return false;
}

function pickOrigin(request: NextRequest): string | null {
  const origin = request.headers.get("origin");
  if (!origin) return null;
  return isAllowedOrigin(origin) ? origin.replace(/\/$/, "") : null;
}

export function middleware(request: NextRequest) {
  const origin = pickOrigin(request);

  if (request.method === "OPTIONS") {
    if (!origin) {
      return new NextResponse(null, { status: 204 });
    }
    return new NextResponse(null, {
      status: 204,
      headers: corsHeaders(origin),
    });
  }

  const response = NextResponse.next();
  if (origin) {
    for (const [key, value] of Object.entries(corsHeaders(origin))) {
      response.headers.set(key, value);
    }
  }
  return response;
}

function corsHeaders(origin: string): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": "true",
    "Vary": "Origin",
  };
}

export const config = {
  matcher: "/api/:path*",
};
