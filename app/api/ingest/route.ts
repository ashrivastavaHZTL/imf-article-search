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

    // 1. Validate
    const errs: string[] = [];
    raw.forEach((item, i) => {
      const e = validateArticle(item);
      if (e) errs.push(`Item ${i + 1}: ${e}`);
    });
    if (errs.length)
      return NextResponse.json({ error: errs.join("; ") }, { status: 400 });

    // 2. Ensure index exists
    console.log("[ingest] Creating/updating index...");
    await indexClient.createOrUpdateIndex(INDEX_SCHEMA);
    console.log("[ingest] Index ready.");

    // 3. Prepare documents
    const warnings: string[] = [];
    const allDocs: Omit<SearchDocument, "contentVector">[] = [];

    raw.forEach((r, i) => {
      const { document: doc } = prepareDocument(r as Record<string, unknown>, i);

      if (!doc?.chunkText) {
        throw new Error(
          `Item ${i + 1}: document has no chunkText. title="${(doc as any)?.title ?? "unknown"}"`,
        );
      }

      allDocs.push(doc);
    });

    if (warnings.length) console.warn("[ingest] warnings:", warnings);

    // 4. Dedup within batch by stable id
    const deduped = [...new Map(allDocs.map((d) => [d.id, d])).values()];
    const skipped = allDocs.length - deduped.length;
    if (skipped > 0) console.log(`[ingest] ${skipped} duplicate(s) skipped`);

    // 5. Embed
    console.log(`[ingest] Embedding ${deduped.length} document(s)...`);
    const vectors = await embedBatch(deduped.map((d) => d.chunkText));

    // 6. Attach vectors
    const documents: SearchDocument[] = deduped.map((d, i) => ({
      ...d,
      contentVector: vectors[i],
    }));

    // 7. Upload
    let indexed = 0,
      failed = 0;
    const errors: string[] = [];

    for (let i = 0; i < documents.length; i += UPLOAD_BATCH) {
      const result = await searchClient.mergeOrUploadDocuments(
        documents.slice(i, i + UPLOAD_BATCH) as any,
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
      warnings: warnings.length ? warnings : undefined,
      errors: errors.length ? errors : undefined,
    } satisfies IngestResponse);
  } catch (err: any) {
    console.error("[ingest]", err);
    return NextResponse.json(
      { error: err.message ?? "Ingest failed" },
      { status: 500 },
    );
  }
}
