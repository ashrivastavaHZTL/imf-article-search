import { NextRequest, NextResponse } from "next/server";
import { searchClient } from "@/lib/search-client";
import { embedOne } from "@/lib/embeddings";
import type {
  SearchRequest,
  SearchResponse,
  SearchResultItem,
  SearchDocument,
} from "@/types";

export async function POST(req: NextRequest) {
  try {
    const { query, top = 10, locale }: SearchRequest = await req.json();
    if (!query?.trim())
      return NextResponse.json({ error: "query is required" }, { status: 400 });

    const t0 = Date.now();
    const vector = await embedOne(query);

    const raw = await searchClient.search(query, {
      vectorSearchOptions: {
        queries: [
          {
            kind: "vector",
            vector,
            kNearestNeighborsCount: top * 2,
            fields: ["contentVector"],
          },
        ],
      },
      filter: locale ? `locale eq '${locale}'` : undefined,
      select: [
        "id",
        "articleId",
        "title",
        "subtitle",
        "abstract",
        "description",
        "pageTitle",
        "locale",
      ] as any,
      top,
    });

    const results: SearchResultItem[] = [];
    for await (const r of raw.results) {
      const d = r.document as SearchDocument;
      results.push({
        id: d.id,
        articleId: d.articleId,
        title: d.title,
        subtitle: d.subtitle,
        abstract: d.abstract,
        description: d.description,
        pageTitle: d.pageTitle,
        locale: d.locale,
        score: r.score ?? 0,
      });
    }

    return NextResponse.json({
      results,
      count: results.length,
      query,
      durationMs: Date.now() - t0,
    } satisfies SearchResponse);
  } catch (err: any) {
    console.error("[search]", err);
    return NextResponse.json(
      { error: err.message ?? "Search failed" },
      { status: 500 },
    );
  }
}
