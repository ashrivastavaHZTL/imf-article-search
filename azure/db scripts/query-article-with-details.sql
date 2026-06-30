-- ============================================================
-- query-article-with-details.sql
-- Pull all articles joined to their details rows.
-- One row per article_details record (an article may appear
-- multiple times if it has entries for multiple locales).
-- ============================================================

SELECT
    a.article_id,
    ad.id          AS detail_id,
    ad.url,
    ad.locale,
    ad.status,
    ad.title,
    ad.created_at
FROM article a
INNER JOIN article_details ad ON ad.article_id = a.article_id
ORDER BY a.article_id, ad.locale;
