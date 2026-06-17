import { NextRequest, NextResponse } from "next/server";
import { fetchArticles } from "@/lib/services/sitecore/articles-service";

function authenticate(
  req: NextRequest,
): { error: string; status: number } | null {
  const isDev = process.env.NODE_ENV === "development";
  const header = req.headers.get("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

  // In dev, a missing token is allowed; a wrong token is still rejected
  if (isDev && !token) return null;

  const secret = process.env.EDGE_API_TOKEN;
  if (!secret) {
    console.error("[articles] ARTICLES_API_SECRET is not set");
    return { error: "Server misconfiguration", status: 500 };
  }
  if (!token || token !== secret) {
    return { error: "Unauthorized", status: 401 };
  }
  return null;
}

export async function GET(req: NextRequest) {
  const authError = authenticate(req);
  if (authError)
    return NextResponse.json(
      { error: authError.error },
      { status: authError.status },
    );

  try {
    const data = await fetchArticles();

    //We could have another process pass the after for us
    // const { searchParams } = req.nextUrl;

    // const data = await fetchArticles({
    //   after: searchParams.get("after") ?? undefined,
    // });

    return NextResponse.json(data);
  } catch (err: any) {
    console.error("[articles]", err);
    return NextResponse.json(
      { error: err.message ?? "Failed to fetch articles" },
      { status: 500 },
    );
  }
}
