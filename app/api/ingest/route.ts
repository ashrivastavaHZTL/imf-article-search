import { NextRequest, NextResponse } from "next/server";
import { indexClient, searchClient, INDEX_SCHEMA } from "@/lib/search-client";
import { prepareDocument, validateArticle } from "@/lib/prepare";
import { embedBatch } from "@/lib/embeddings";
import type { IngestResponse, SearchDocument } from "@/types";
import { isValidGuid } from "@/lib/utils/string/id";

export const maxDuration = 300;
const UPLOAD_BATCH = 500;

// ─── Extract articleId directly from raw JSON ─────────────────────────────────
// Done here so it works regardless of which version of prepare.ts is installed.
function extractArticleId(raw: Record<string, unknown>): {
  articleId: string;
  articleIdWarning: string | undefined;
} {
  const candidates = ["articleId", "ArticleId", "article_id", "articleID"];
  let rawValue = "";
  for (const key of candidates) {
    if (typeof raw[key] === "string" && (raw[key] as string).trim()) {
      rawValue = (raw[key] as string).trim();
      break;
    }
  }

  if (!rawValue) return { articleId: "", articleIdWarning: undefined };

  if (isValidGuid(rawValue)) {
    return { articleId: rawValue, articleIdWarning: undefined };
  }

  return {
    articleId: "",
    articleIdWarning:
      `articleId "${rawValue}" is not a valid GUID ` +
      `(expected: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx) — stored as empty`,
  };
}

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

    // 3. Prepare documents + extract articleId
    const warnings: string[] = [];
    const allDocs: Omit<SearchDocument, "contentVector">[] = [];

    raw.forEach((r, i) => {
      const rawRecord = r as Record<string, unknown>;
      const result = prepareDocument(rawRecord, i);

      // Handle both PrepareResult { document } and plain document shapes
      let doc: Omit<SearchDocument, "contentVector">;
      if (result && typeof result === "object" && "document" in result) {
        const pr = result as {
          document: Omit<SearchDocument, "contentVector">;
          articleIdWarning?: string;
        };
        doc = pr.document;
        if (pr.articleIdWarning)
          warnings.push(`Item ${i + 1}: ${pr.articleIdWarning}`);
      } else {
        doc = result as unknown as Omit<SearchDocument, "contentVector">;
      }

      if (!doc?.chunkText) {
        throw new Error(
          `Item ${i + 1}: document has no chunkText. title="${(doc as any)?.title ?? "unknown"}"`,
        );
      }

      // Extract articleId directly from raw JSON — ensures it is always set
      // regardless of which version of prepare.ts is installed locally.
      const { articleId, articleIdWarning } = extractArticleId(rawRecord);
      if (articleIdWarning) warnings.push(`Item ${i + 1}: ${articleIdWarning}`);

      // Overwrite whatever prepare.ts put (may be "" from old version)
      allDocs.push({ ...doc, articleId });
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
        documents.slice(i, i + UPLOAD_BATCH),
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
