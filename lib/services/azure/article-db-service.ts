import sql from "mssql";
import { ArticleResult } from "@/lib/models/api/response/graphql/articles/article.model";
import { getDatabaseConnection } from "@/lib/services/azure/db-config";
import { indexArticle } from "./article-index-service";

// ---------------------------------------------------------------------------
// Row types — mirror the DB schema in create-article-tables.sql
// ---------------------------------------------------------------------------

export interface ArticleRow {
  article_id: string;
}

export interface ArticleDetailsRow extends MergeAction {
  url: string;
  article_id: string;
  language_code: string;
  status: "processed" | "pending";
  title: string | null;
  created_at: Date;
}
export interface MergeAction {
  merge_action?: "INSERT" | "UPDATE";
}

export interface SyncSummary {
  total: number;
  persisted: number;
  errors: string[];
}

export interface WatermarkRow {
  id: number;
  last_synced_at: Date;
  updated_at: Date;
}
// article_sync_watermark — singleton row (id = 1)

export async function getWatermark(): Promise<boolean> {
  try {
    const db = await getDatabaseConnection("article_db");

    if (!db) return false;

    const result = await db
      .request()
      .query<WatermarkRow>(
        "SELECT id, last_synced_at, updated_at FROM article_sync_watermark WHERE id = 1",
      );

    if (result?.recordset && result.recordset[0].id) {
      return true;
    }
  } catch (err) {
    // log error details
  }

  return false;
}

export async function setWatermark(lastSyncedAt: Date): Promise<boolean> {
  try {
    const db = await getDatabaseConnection("article_db");

    if (!db) return false;

    const result = await db
      .request()
      .input("lastSyncedAt", sql.DateTimeOffset, lastSyncedAt)
      .query<WatermarkRow>(
        "UPDATE article_sync_watermark SET last_synced_at = @lastSyncedAt, updated_at = GETUTCDATE() WHERE id = 1",
      );

    if (result?.recordset && result.recordset[0].id) {
      return true;
    }
  } catch (err) {
    // log error details
  }

  return false;
}

// article — one row per unique Sitecore article GUID

export async function upsertArticle(articleId: string): Promise<boolean> {
  try {
    const db = await getDatabaseConnection("article_db");

    if (!db) return false;

    const result = await db
      .request()
      .input("articleId", sql.NVarChar, articleId)
      .query<ArticleRow>(
        "IF NOT EXISTS (SELECT 1 FROM article WHERE article_id = @articleId) INSERT INTO article (article_id) VALUES (@articleId)",
      );

    if (result.recordset && result.recordset[0].article_id) {
      return true;
    }
  } catch (err) {
    // log error details
  }

  return false;
}

// article_details — one row per url; references article(article_id)

export async function updateArticleStatus(
  url: string,
  status: ArticleDetailsRow["status"],
): Promise<boolean> {
  try {
    const db = await getDatabaseConnection("article_db");

    if (!db) return false;

    const result = await db
      .request()
      .input("url", sql.NVarChar, url)
      .input("status", sql.VarChar, status)
      .query<ArticleDetailsRow>(
        "UPDATE article_details SET status = @status WHERE url = @url",
      );

    if (result.recordset && result.recordset[0].status == status) {
      return true;
    }
  } catch (err) {
    // log error details
  }

  return false;
}

export async function upsertArticleDetails(
  details: Omit<ArticleDetailsRow, "created_at">,
): Promise<boolean> {
  try {
    const db = await getDatabaseConnection("article_db");

    if (!db) return false;

    const result = await db
      .request()
      .input("url", sql.NVarChar, details.url)
      .input("articleId", sql.NVarChar, details.article_id)
      .input("languageCode", sql.VarChar, details.language_code)
      .input("status", sql.VarChar, details.status)
      .input("title", sql.NVarChar, details.title).query<ArticleDetailsRow>(`
        MERGE article_details AS target
        USING (VALUES (@url, @articleId, @languageCode, @status, @title))
          AS source (url, article_id, language_code, status, title)
        ON target.url = source.url
        WHEN MATCHED THEN
          UPDATE SET status = source.status,
                     title  = source.title
        WHEN NOT MATCHED THEN
          INSERT (url, article_id, language_code, status, title)
          VALUES (source.url, source.article_id, source.language_code, source.status, source.title)
        OUTPUT $action          AS merge_action,
               INSERTED.id,
               INSERTED.url,
               INSERTED.article_id,
               INSERTED.language_code,
               INSERTED.status,
               INSERTED.title,
               INSERTED.created_at;
      `);

    const row = result.recordset?.[0];
    if (row) {
      console.log(
        `[article-db] upsertArticleDetails — ${row.merge_action}: ${row.url}`,
      );
      return true;
    }
  } catch (err) {
    // log error details
  }

  return false;
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
      const insertArticleResult = await upsertArticleDetails({
        url: result.url.url ?? "",
        article_id: result.id,
        language_code: result.language.name,
        status: "pending",
        title: result.title?.value ?? null,
      });

      //TODO: re-enable vectore be insertion and validating azure db results and adding response typ mapping.
      // if (insertArticleResult) {
      //   const indexResult = await indexArticle(result);

      //   if (indexResult.indexed > 0) {
      //     await updateArticleStatus(result.url.url, "processed");
      //   }
      // }
    } catch (err: any) {
      errors.push(`${result.id}: ${err.message ?? "DB write failed"}`);
    }
  }

  if (!errors.length) {
    //await setWatermark(syncedAt);
  }

  return {
    total: results.length,
    persisted: results.length - errors.length,
    errors,
  };
}
