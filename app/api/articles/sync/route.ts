import { NextRequest, NextResponse } from "next/server";
import { fetchArticles } from "@/lib/services/sitecore/articles-service";
import { persistSync } from "@/lib/services/azure/article-db-service";
import { ArticleResult } from "@/lib/models/api/response/graphql/articles/article.model";
import { authenticate } from "@/lib/server-utils/api/authenticate";

export async function GET(req: NextRequest) {
  const authError = authenticate(req);
  if (authError)
    return NextResponse.json(
      { error: authError.error },
      { status: authError.status },
    );

  //Since will be paste to drive the get by last updated date.
  const since = req.nextUrl.searchParams.get("since") ?? undefined;

  const syncedAt = new Date();
  const collected: ArticleResult[] = [];
  let pages = 0;
  let cursor: string | undefined;

  try {
    // Paginate through all results until hasNext is false
    do {
      const response = await fetchArticles({
        publishedAfter: since,
        after: cursor,
      });
      if (!response?.data) {
        break;
      }

      //TODO: This need to be refactored, I don't like how it is pulling the error details.
      if (response.errors) {
        return NextResponse.json(
          { error: response.errors[0].message },
          { status: 502 },
        );
      }

      const { results, pageInfo } = response.data.search;
      collected.push(...results);
      pages++;

      cursor = pageInfo.hasNext ? pageInfo.endCursor : undefined;
    } while (cursor);

    const summary = await persistSync(collected, syncedAt);

    // TODO: Define response type
    return NextResponse.json({
      since: since ?? "default-lookback",
      pages: collected,
      count: collected.length,
      ...summary,
    });
  } catch (err: any) {
    console.error("[articles/sync]", err);
    return NextResponse.json(
      { error: err.message ?? "Sync failed" },
      { status: 500 },
    );
  }
}
