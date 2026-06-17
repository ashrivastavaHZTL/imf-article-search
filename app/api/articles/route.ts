import { NextRequest, NextResponse } from "next/server";
import { fetchArticles } from "@/lib/services/sitecore/articles-service";
import { authenticate } from "@/lib/server-utils/api/authenticate";

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
