import { searchClient } from "@/lib/search-client";
import { embedBatch } from "@/lib/embeddings";
import { stripHtml, detectLanguage, buildChunkText } from "@/lib/prepare";
import type { SearchDocument } from "@/types";
import { ArticleResult } from "@/lib/models/api/response/graphql/articles/article.model";

export interface IndexResult {
  indexed: number;
  failed: number;
  errors: string[];
}

function toSearchDocument(
  result: ArticleResult,
): Omit<SearchDocument, "contentVector"> {
  const title = stripHtml(result.title?.value ?? result.name);
  const abstract = stripHtml(result.abstract?.value ?? "");

  return {
    id: result.id,
    title,
    subtitle: "",
    abstract,
    description: "",
    pageTitle: result.name,
    language: detectLanguage(title),
    chunkText: buildChunkText({
      title,
      subtitle: "",
      abstract,
      description: "",
      pageTitle: result.name,
    }),
  };
}

export async function indexArticles(
  results: ArticleResult[],
): Promise<IndexResult> {
  if (!results.length) return { indexed: 0, failed: 0, errors: [] };

  const docs = results.map(toSearchDocument);
  const vectors = await embedBatch(docs.map((d) => d.chunkText));

  const documents: SearchDocument[] = docs.map((d, i) => ({
    ...d,
    contentVector: vectors[i],
  }));

  const upload = await searchClient.mergeOrUploadDocuments(documents as any);

  const errors: string[] = [];
  let indexed = 0;
  let failed = 0;

  for (const r of upload.results) {
    r.succeeded
      ? indexed++
      : (failed++,
        errors.push(`${r.key}: ${r.errorMessage ?? "unknown error"}`));
  }

  return { indexed, failed, errors };
}
