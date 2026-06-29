import { searchClient } from "@/lib/search-client";
import { embedBatch } from "@/lib/embeddings";
import type { SearchDocument } from "@/types";
import { ArticleResult } from "@/lib/models/api/response/graphql/articles/article.model";
import { stripHtml } from "@/lib/utils/string/string";
import { buildChunkText } from "@/lib/builder/search/search-doucment-builder";

export interface IndexResult {
  indexed: number;
  failed: number;
  errors: string[];
}

function toSearchDocument(
  result: ArticleResult,
): Omit<SearchDocument, "contentVector"> {
  const title = stripHtml(result.title?.value ?? result.name);
  const pageTitle = stripHtml(result.title?.value ?? result.name);
  const abstract = stripHtml(result.abstract?.value ?? "");
  const articleId = result.id;
  const content = stripHtml(result.content?.value ?? "");
  const subtitle = stripHtml(
    result.subtitle_348d48e267c343cf940d63c46c3ccf87?.value ?? "",
  );

  return {
    //TODO: need to confirm with Abhi that we should be sending the id.
    // I think we should also be storing url as part of the search index object
    id: result.url.url ?? articleId + result.language.name,
    articleId: articleId,
    title,
    subtitle,
    abstract,
    description: content,
    pageTitle,
    language: result.language.name,
    chunkText: buildChunkText({
      title,
      subtitle,
      abstract,
      description: content,
      pageTitle,
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

export async function indexArticle(
  result: ArticleResult,
): Promise<IndexResult> {
  if (!result) return { indexed: 0, failed: 0, errors: [] };

  const doc = toSearchDocument(result);
  // TODO: need to understand what this is and why it needs a text array
  const vectors = await embedBatch([doc.chunkText]);

  const documents: SearchDocument[] = [
    {
      ...doc,
      contentVector: vectors[0],
    },
  ];

  const upload = await searchClient.mergeOrUploadDocuments(documents);

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
