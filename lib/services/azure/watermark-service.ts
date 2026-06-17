import { ArticleResult } from "@/lib/models/api/response/graphql/articles/article.model";

export interface WatermarkRow {
  id: number;
  last_synced_at: Date;
  last_job_status: "success" | "failed" | "running" | null;
  last_job_run_at: Date | null;
  total_articles_processed: number;
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

export async function getWatermark(): Promise<WatermarkRow | null> {
  // TODO: SELECT * FROM sync_watermark WHERE id = 1
  console.log("[watermark] getWatermark — not yet implemented");
  return null;
}

export async function setWatermark(lastSyncedAt: Date): Promise<void> {
  // TODO:
  //   MERGE sync_watermark AS target
  //   USING (VALUES (1, @lastSyncedAt, 'success', GETUTCDATE())) ...
  //   ON target.id = 1
  //   WHEN MATCHED THEN UPDATE SET last_synced_at = @lastSyncedAt, last_job_status = 'success', last_job_run_at = GETUTCDATE()
  //   WHEN NOT MATCHED THEN INSERT (id, last_synced_at, last_job_status, last_job_run_at) VALUES (...)
  console.log("[watermark] setWatermark →", lastSyncedAt.toISOString());
}

export async function insertSyncArticles(articleIds: string[]): Promise<void> {
  if (!articleIds.length) return;
  // TODO: batch insert into sync_watermark_articles — unique constraint
  //   (watermark_id, article_id) prevents duplicates automatically.
  //
  //   for (const id of articleIds) {
  //     await db.request()
  //       .input("article_id", sql.NVarChar, id)
  //       .query(`
  //         IF NOT EXISTS (SELECT 1 FROM sync_watermark_articles WHERE watermark_id = 1 AND article_id = @article_id)
  //           INSERT INTO sync_watermark_articles (watermark_id, article_id) VALUES (1, @article_id)
  //       `);
  //   }
  console.log(
    `[watermark] insertSyncArticles — ${articleIds.length} ids (stub)`,
  );
}

export async function upsertArticles(articles: ArticleResult[]): Promise<void> {
  if (!articles.length) return;
  // TODO: upsert each article into the `articles` table.
  //   MERGE articles AS target
  //   USING (VALUES (@article_id, @title, @publish_date, @description)) AS source (article_id, title, publish_date, description)
  //   ON target.article_id = source.article_id
  //   WHEN MATCHED THEN UPDATE SET title = source.title, publish_date = source.publish_date, ...
  //   WHEN NOT MATCHED THEN INSERT ...
  console.log(`[watermark] upsertArticles — ${articles.length} records (stub)`);
}

export async function persistSync(
  articles: ArticleResult[],
  syncedAt: Date,
): Promise<SyncSummary> {
  const errors: string[] = [];

  try {
    await upsertArticles(articles);
    await insertSyncArticles(articles.map((a) => a.id));
    await setWatermark(syncedAt);
  } catch (err: any) {
    errors.push(err.message ?? "DB write failed");
  }

  return {
    total: articles.length,
    persisted: errors.length ? 0 : articles.length,
    errors,
  };
}
