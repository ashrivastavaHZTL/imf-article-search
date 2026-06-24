import sql from "mssql";
import { ArticleResult } from "@/lib/models/api/response/graphql/articles/article.model";
import { getDatabaseConnection } from "@/lib/services/azure/db-config";

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

// article_sync_watermark — singleton row (id = 1)

export async function getWatermark(): Promise<WatermarkRow | null> {
  const db = await getDatabaseConnection("article_db");
  const result = await db.request().query<WatermarkRow>(
    "SELECT id, last_synced_at, updated_at FROM article_sync_watermark WHERE id = 1",
  );
  return result.recordset[0] ?? null;
}

export async function setWatermark(lastSyncedAt: Date): Promise<void> {
  const db = await getDatabaseConnection("article_db");
  await db
    .request()
    .input("lastSyncedAt", sql.DateTimeOffset, lastSyncedAt)
    .query(
      "UPDATE article_sync_watermark SET last_synced_at = @lastSyncedAt, updated_at = GETUTCDATE() WHERE id = 1",
    );
}

// article — one row per unique Sitecore article GUID

export async function upsertArticle(articleId: string): Promise<void> {
  const db = await getDatabaseConnection("article_db");
  await db
    .request()
    .input("articleId", sql.NVarChar, articleId)
    .query(
      "IF NOT EXISTS (SELECT 1 FROM article WHERE article_id = @articleId) INSERT INTO article (article_id) VALUES (@articleId)",
    );
}

// article_details — one row per url; references article(article_id)

export async function upsertArticleDetails(
  details: Omit<ArticleDetailsRow, "created_at">,
): Promise<void> {
  const db = await getDatabaseConnection("article_db");
  await db
    .request()
    .input("url",          sql.NVarChar,  details.url)
    .input("articleId",    sql.NVarChar,  details.article_id)
    .input("languageCode", sql.VarChar,   details.language_code)
    .input("status",       sql.VarChar,   details.status)
    .input("title",        sql.NVarChar,  details.title)
    .query(`
      MERGE article_details AS target
      USING (VALUES (@url, @articleId, @languageCode, @status, @title))
        AS source (url, article_id, language_code, status, title)
      ON target.url = source.url
      WHEN MATCHED THEN
        UPDATE SET language_code = source.language_code,
                   status        = source.status,
                   title         = source.title
      WHEN NOT MATCHED THEN
        INSERT (url, article_id, language_code, status, title)
        VALUES (source.url, source.article_id, source.language_code, source.status, source.title);
    `);
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
