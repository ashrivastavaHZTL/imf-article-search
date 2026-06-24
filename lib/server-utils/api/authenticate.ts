import { NextRequest } from "next/server";

export function authenticate(
  req: NextRequest,
): { error: string; status: number } | null {
  const isDev = process.env.NODE_ENV === "development";
  const header = req.headers.get("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

  // In dev, a missing token is allowed; a wrong token is still rejected
  if (isDev) return null;

  const secret = process.env.IMF_API_BEARER_TOKEN;
  if (!secret) {
    console.error("IMF_API_BEARER_TOKEN is not set");
    return { error: "Server error", status: 500 };
  }
  if (!token || token !== secret) {
    return { error: "Unauthorized", status: 401 };
  }
  return null;
}
