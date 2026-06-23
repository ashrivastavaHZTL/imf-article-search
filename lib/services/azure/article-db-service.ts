import { ArticleResult } from "@/lib/models/api/response/graphql/articles/article.model";

// ---------------------------------------------------------------------------
// Row types — mirror the DB schema in create-article-tables.sql
// ---------------------------------------------------------------------------

export interface WatermarkRow {
  id: number;
  last_synced_at: Date;
  updated_at: Date;
}

export interface ArticleRow {
  article_id: string;
}

export interface ArticleDetailsRow {
  url: string;
  article_id: string;
  language_code: string;
  status: "processed" | "pending";
  title: string | null;
  created_at: Date;
}

export interface SyncSummary {
  total: number;
  persisted: number;
  errors: string[];
}

// ---------------------------------------------------------------------------
// TODO: replace stub bodies with mssql once the package is added.
//
// Suggested pool setup at the top of this file:
//   import sql from "mssql";
//   const pool = sql.connect(process.env.AZURE_SQL_CONNECTION_STRING!);
//
// Then each function opens a request with:
//   const db = await pool;
//   await db.request().input(...).query("...");
// ---------------------------------------------------------------------------

// article_sync_watermark — singleton row (id = 1)

export async function getWatermark(): Promise<WatermarkRow | null> {
  // TODO: SELECT id, last_synced_at, updated_at
  //         FROM article_sync_watermark WHERE id = 1
  console.log("[article-db] getWatermark — not yet implemented");
  return null;
}

export async function setWatermark(lastSyncedAt: Date): Promise<void> {
  // TODO: UPDATE article_sync_watermark
  //         SET last_synced_at = @lastSyncedAt, updated_at = GETUTCDATE()
  //         WHERE id = 1
  console.log("[article-db] setWatermark →", lastSyncedAt.toISOString());
}

// article — one row per unique Sitecore article GUID

export async function upsertArticle(articleId: string): Promise<void> {
  // TODO: IF NOT EXISTS (SELECT 1 FROM article WHERE article_id = @articleId)
  //         INSERT INTO article (article_id) VALUES (@articleId)
  console.log("[article-db] upsertArticle →", articleId);
}

// article_details — one row per url; references article(article_id)

export async function upsertArticleDetails(
  details: Omit<ArticleDetailsRow, "created_at">,
): Promise<void> {
  // TODO: MERGE article_details AS target
  //       USING (VALUES (@url, @article_id, @language_code, @status, @title))
  //         AS source (url, article_id, language_code, status, title)
  //       ON target.url = source.url
  //       WHEN MATCHED THEN
  //         UPDATE SET language_code = source.language_code,
  //                    status        = source.status,
  //                    title         = source.title
  //       WHEN NOT MATCHED THEN
  //         INSERT (url, article_id, language_code, status, title)
  //         VALUES (source.url, source.article_id, source.language_code, source.status, source.title);
  console.log("[article-db] upsertArticleDetails →", details.url);
}

// ---------------------------------------------------------------------------
// Orchestrator — called by the sync route
// ---------------------------------------------------------------------------

export async function persistSync(
  results: ArticleResult[],
  syncedAt: Date,
): Promise<SyncSummary> {
  const errors: string[] = [];

  for (const result of results) {
    //TODO: review logging and error handling
    if (!result || !result.url.url) {
      errors.push(`${result.id}: Critical details missing for result.`);
      continue;
    }

    try {
      await upsertArticle(result.id);

      await upsertArticleDetails({
        url: result.url.url ?? "",
        article_id: result.id,
        language_code: result.language.name,
        status: "pending",
        title: result.title?.value ?? null,
      });
    } catch (err: any) {
      errors.push(`${result.id}: ${err.message ?? "DB write failed"}`);
    }
  }

  if (!errors.length) {
    await setWatermark(syncedAt);
  }

  return {
    total: results.length,
    persisted: results.length - errors.length,
    errors,
  };
}
