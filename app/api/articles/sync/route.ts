import { NextRequest, NextResponse } from "next/server";
import { fetchArticles } from "@/lib/services/sitecore/articles-service";
import { persistSync } from "@/lib/services/azure/article-db-service";
import { ArticleResult } from "@/lib/models/api/response/graphql/articles/article.model";
import { authenticate } from "@/lib/server-utils/api/authenticate";
import { INDEX_SCHEMA, indexClient } from "@/lib/search-client";
import { getpublishedAfterDate } from "@/lib/utils/date/published-after";

function toISOOrNull(
  value: string | null,
): { iso: string } | { error: string } | null {
  if (!value) return null;
  const date = new Date(value);
  if (isNaN(date.getTime())) return { error: `"${value}" is not a valid date` };
  return { iso: date.toISOString() };
}

export async function GET(req: NextRequest) {
  const authError = authenticate(req);
  if (authError)
    return NextResponse.json(
      { error: authError.error },
      { status: authError.status },
    );

  const sinceParam = toISOOrNull(req.nextUrl.searchParams.get("since"));
  const untilParam = toISOOrNull(req.nextUrl.searchParams.get("until"));

  if (sinceParam && "error" in sinceParam)
    return NextResponse.json(
      { error: `Invalid 'since': ${sinceParam.error}` },
      { status: 400 },
    );
  if (untilParam && "error" in untilParam)
    return NextResponse.json(
      { error: `Invalid 'until': ${untilParam.error}` },
      { status: 400 },
    );

  const since = sinceParam ? sinceParam.iso : getpublishedAfterDate();
  const until = untilParam ? untilParam.iso : new Date().toISOString();
  const path = req.nextUrl.searchParams.get("path") ?? undefined;

  const syncedAt = new Date();
  const collected: ArticleResult[] = [];
  let pages = 0;
  let cursor: string | undefined;

  try {
    // Paginate through all results until hasNext is false
    do {
      const response = await fetchArticles({
        publishedAfter: since,
        publishedBefore: until,
        path,
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

    // 2. Ensure index exists
    console.log("[indexArticles] Creating/updating index...");
    const index = await indexClient.createOrUpdateIndex(INDEX_SCHEMA);
    console.log("[indexArticles] Index ready.");

    if (!index?.name) {
      console.error(
        "[articles/sync]",
        "Search index failed to create or update.",
      );
      return NextResponse.json(
        { error: "Search Index missing, Sync failed" },
        { status: 500 },
      );
    }

    //const summary = await persistSync(collected, syncedAt);

    // TODO: Define response type
    return NextResponse.json({
      since: since,
      until,
      pages: collected,
      count: collected.length,
      //...summary,
    });
  } catch (err: any) {
    console.error("[articles/sync]", err);
    return NextResponse.json(
      { error: err.message ?? "Sync failed" },
      { status: 500 },
    );
  }
}
