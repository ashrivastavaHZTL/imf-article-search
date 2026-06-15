import { NextRequest, NextResponse } from "next/server";
import { indexClient, searchClient, INDEX_SCHEMA } from "@/lib/search-client";
import { prepareDocument, validateArticle } from "@/lib/prepare";
import { embedBatch } from "@/lib/embeddings";
import type { IngestResponse, SearchDocument } from "@/types";

export const maxDuration = 300;
const UPLOAD_BATCH = 500;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const raw: unknown[] = Array.isArray(body) ? body : [body];

    const errs: string[] = [];
    raw.forEach((item, i) => {
      const e = validateArticle(item);
      if (e) errs.push(`Item ${i + 1}: ${e}`);
    });
    if (errs.length)
      return NextResponse.json({ error: errs.join("; ") }, { status: 400 });

    // Create index — surface the error if this fails
    console.log("[ingest] Creating/updating index...");
    await indexClient.createOrUpdateIndex(INDEX_SCHEMA);
    console.log("[ingest] Index ready.");

    const prepared = raw.map((r, i) =>
      prepareDocument(r as Record<string, unknown>, i)
    );

    // Dedup within this batch — keep last occurrence of each id
    // (stableId means same title = same id, so duplicates collapse here)
    const deduped = [...new Map(prepared.map(d => [d.id, d])).values()];
    const skipped = prepared.length - deduped.length;
    if (skipped > 0) console.log(`[ingest] ${skipped} within-batch duplicate(s) skipped`);

    const vectors = await embedBatch(deduped.map(d => d.chunkText));

    const documents: SearchDocument[] = deduped.map((d, i) => ({
      ...d,
      contentVector: vectors[i],
    }));

    let indexed = 0, failed = 0;
    const errors: string[] = [];

    for (let i = 0; i < documents.length; i += UPLOAD_BATCH) {
      const result = await searchClient.mergeOrUploadDocuments(
        documents.slice(i, i + UPLOAD_BATCH) as any
      );
      for (const r of result.results) {
        r.succeeded
          ? indexed++
          : (failed++, errors.push(`${r.key}: ${r.errorMessage}`));
      }
    }

    return NextResponse.json({
      total: raw.length,
      skipped,
      indexed,
      failed,
      errors: errors.length ? errors : undefined,
    } satisfies IngestResponse);

  } catch (err: any) {
    console.error("[ingest]", err);
    return NextResponse.json(
      { error: err.message ?? "Ingest failed" },
      { status: 500 }
    );
  }
}
